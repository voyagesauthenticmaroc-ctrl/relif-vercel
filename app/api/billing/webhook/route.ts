import {
  beginStripeEvent,
  completeStripeEvent,
  findBillingIdentity,
  findCheckoutSessionIdentity,
  markCheckoutSessionStatus,
  provisionSubscription,
} from "../../../../db/commercial";
import { getPlan } from "../../../../lib/plans";
import {
  getStripeSecretKey,
  getStripeWebhookSecret,
  stripeGet,
} from "../../../../lib/stripe";

const MAX_WEBHOOK_BYTES = 1_000_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StripeObject = {
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  current_period_start?: number;
  customer?: string | { id?: string } | null;
  customer_details?: { email?: string | null };
  customer_email?: string | null;
  id?: string;
  items?: {
    data?: Array<{
      current_period_end?: number;
      current_period_start?: number;
      price?: { id?: string };
    }>;
  };
  metadata?: Record<string, string>;
  parent?: {
    subscription_details?: {
      subscription?: string | { id?: string } | null;
    } | null;
  } | null;
  payment_status?: string;
  status?: string;
  subscription?: string | { id?: string } | null;
  trial_end?: number | null;
};

type StripeEvent = {
  created: number;
  data: { object: StripeObject };
  id: string;
  livemode: boolean;
  type: string;
};

class BodyTooLargeError extends Error {}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string,
) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1_000 - timestampNumber) > 300
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = hex(digest);
  return signatures.some((signature) => secureEqual(signature, expected));
}

async function readLimitedBody(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) throw new BodyTooLargeError();
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function objectId(
  value: StripeObject["customer"] | StripeObject["subscription"],
) {
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

function subscriptionStatus(value: string | undefined) {
  if (value === "active" || value === "trialing") return value;
  if (
    value === "past_due" ||
    value === "unpaid" ||
    value === "incomplete" ||
    value === "incomplete_expired" ||
    value === "paused" ||
    value === "canceled"
  ) {
    return value;
  }
  return "inactive";
}

function eventPriority(type: string) {
  if (type === "customer.subscription.deleted") return 95;
  if (type === "invoice.paid") return 90;
  if (type === "invoice.payment_failed") return 85;
  if (type === "customer.subscription.updated") return 70;
  if (type === "customer.subscription.created") return 50;
  if (type === "checkout.session.async_payment_succeeded") return 65;
  if (type === "checkout.session.completed") return 60;
  return 10;
}

function priceIdFor(object: StripeObject) {
  return object.items?.data?.[0]?.price?.id ?? null;
}

function billingPeriodFor(object: StripeObject) {
  const item = object.items?.data?.[0];
  return {
    end: item?.current_period_end ?? object.current_period_end,
    start: item?.current_period_start ?? object.current_period_start,
  };
}

function invoiceSubscriptionId(object: StripeObject) {
  return objectId(
    object.parent?.subscription_details?.subscription ?? null,
  );
}

function priceConfiguration(priceId: string) {
  for (const planCode of ["solo", "consultant", "agency"] as const) {
    const plan = getPlan(planCode);
    if (!plan) continue;
    for (const billingCycle of ["monthly", "annual"] as const) {
      if (process.env[plan.stripePriceEnv[billingCycle]]?.trim() === priceId) {
        return { billingCycle, plan };
      }
    }
  }
  throw new Error("Stripe Price is not mapped to a Relief plan");
}

async function subscriptionIdentity(
  object: StripeObject,
  fallback?: {
    email?: string | null;
    planCode?: string | null;
  },
  allowSubscriptionReplacement = false,
) {
  const stripeCustomerId = objectId(object.customer);
  const stripeSubscriptionId = object.id ?? null;
  const stored = await findBillingIdentity(
    allowSubscriptionReplacement
      ? { stripeCustomerId, stripeSubscriptionId }
      : { stripeSubscriptionId },
  );
  const email = (
    object.metadata?.user_email ??
    fallback?.email ??
    stored?.email ??
    ""
  )
    .trim()
    .toLowerCase();
  const priceId = priceIdFor(object) ?? stored?.stripe_price_id ?? "";
  const configuration = priceConfiguration(priceId);

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new Error("Stripe event has no valid account email");
  }
  if (
    fallback?.planCode &&
    fallback.planCode !== configuration.plan.code
  ) {
    throw new Error("Stripe Price does not match the registered Checkout plan");
  }
  if (stored?.email && stored.email.toLowerCase() !== email) {
    throw new Error("Stripe customer ownership does not match event metadata");
  }

  return {
    billingCycle: configuration.billingCycle,
    email,
    planCode: configuration.plan.code,
    priceId,
    stripeCustomerId,
    stripeSubscriptionId,
  };
}

async function provisionFromSubscription(
  object: StripeObject,
  event: StripeEvent,
  fallback?: {
    email?: string | null;
    planCode?: string | null;
  },
  forcedStatus?: string,
  allowSubscriptionReplacement = false,
) {
  const identity = await subscriptionIdentity(
    object,
    fallback,
    allowSubscriptionReplacement,
  );
  const billingPeriod = billingPeriodFor(object);
  await provisionSubscription({
    allowSubscriptionReplacement,
    billingCycle: identity.billingCycle,
    cancelAtPeriodEnd: object.cancel_at_period_end,
    currentPeriodEnd: billingPeriod.end,
    currentPeriodStart: billingPeriod.start,
    email: identity.email,
    eventCreated: event.created,
    eventOrder: event.created * 100 + eventPriority(event.type),
    planCode: identity.planCode,
    status:
      forcedStatus ??
      (event.type === "customer.subscription.deleted"
        ? "canceled"
        : subscriptionStatus(object.status)),
    stripeCustomerId: identity.stripeCustomerId,
    stripePriceId: identity.priceId,
    stripeSubscriptionId: identity.stripeSubscriptionId,
    trialEnd: object.trial_end,
  });
}

export async function POST(request: Request) {
  const secret = getStripeWebhookSecret();
  const secretKey = getStripeSecretKey();
  const signature = request.headers.get("stripe-signature");
  if (!secret || !secretKey || !signature) {
    return Response.json(
      { error: "Webhook Stripe non configuré." },
      { status: 503 },
    );
  }

  let body: string;
  try {
    body = await readLimitedBody(request, MAX_WEBHOOK_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return Response.json({ error: "Corps trop volumineux." }, { status: 413 });
    }
    return Response.json({ error: "Corps illisible." }, { status: 400 });
  }

  if (!(await verifyStripeSignature(body, signature, secret))) {
    return Response.json({ error: "Signature invalide." }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return Response.json({ error: "Événement invalide." }, { status: 400 });
  }
  if (
    !event.id ||
    !event.type ||
    !Number.isFinite(event.created) ||
    typeof event.livemode !== "boolean" ||
    !event.data?.object
  ) {
    return Response.json({ error: "Événement incomplet." }, { status: 400 });
  }

  const expectsLiveMode = secretKey.startsWith("sk_live_");
  if (event.livemode !== expectsLiveMode) {
    return Response.json(
      { error: "Mode Stripe incohérent." },
      { status: 400 },
    );
  }

  const object = event.data.object;
  const shouldProcess = await beginStripeEvent({
    created: event.created,
    eventId: event.id,
    objectId: object.id ?? null,
    type: event.type,
  });
  if (!shouldProcess) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      if (object.id) {
        await markCheckoutSessionStatus(object.id, "expired");
      }
    } else if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      if (!object.id) throw new Error("Checkout Session has no id");
      const checkoutIdentity = await findCheckoutSessionIdentity(object.id);
      if (!checkoutIdentity) {
        throw new Error("Checkout Session is not registered by Relief");
      }
      const metadataEmail = object.metadata?.user_email?.trim().toLowerCase();
      const metadataPlan = object.metadata?.plan_code?.trim();
      if (
        metadataEmail !== checkoutIdentity.email ||
        metadataPlan !== checkoutIdentity.plan_code
      ) {
        throw new Error("Checkout Session metadata does not match its owner");
      }

      await markCheckoutSessionStatus(object.id, "complete");
      const paymentConfirmed =
        event.type === "checkout.session.async_payment_succeeded" ||
        object.payment_status === "paid" ||
        object.payment_status === "no_payment_required";
      if (paymentConfirmed) {
        const subscriptionId = objectId(object.subscription);
        if (!subscriptionId) {
          throw new Error("Paid Checkout Session has no subscription");
        }
        const subscription = await stripeGet<StripeObject>(
          `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        );
        await provisionFromSubscription(
          subscription,
          event,
          {
            email: checkoutIdentity.email,
            planCode: checkoutIdentity.plan_code,
          },
          undefined,
          true,
        );
      }
    } else if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed"
    ) {
      const subscriptionId = invoiceSubscriptionId(object);
      if (!subscriptionId) {
        throw new Error("Subscription invoice has no subscription id");
      }
      const stored = await findBillingIdentity({
        stripeSubscriptionId: subscriptionId,
      });
      if (event.type === "invoice.paid" || stored) {
        const subscription = await stripeGet<StripeObject>(
          `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        );
        await provisionFromSubscription(
          subscription,
          event,
          stored ? { email: stored.email } : undefined,
          event.type === "invoice.payment_failed" ? "past_due" : undefined,
          event.type === "invoice.paid",
        );
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscriptionId = object.id ?? null;
      const stored = await findBillingIdentity({
        stripeSubscriptionId: subscriptionId,
      });
      if (stored && subscriptionId) {
        const subscription = await stripeGet<StripeObject>(
          `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        );
        await provisionFromSubscription(subscription, event, {
          email: stored.email,
        });
      }
    } else if (event.type === "customer.subscription.deleted") {
      const stored = await findBillingIdentity({
        stripeSubscriptionId: object.id ?? null,
      });
      if (stored) {
        await provisionFromSubscription(object, event, {
          email: stored.email,
        });
      }
    }

    await completeStripeEvent(event.id);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await completeStripeEvent(event.id, message.slice(0, 500));
    console.error("[relief-commercial] Stripe webhook failed", {
      eventId: event.id,
      message,
      type: event.type,
    });
    return Response.json({ error: "Traitement impossible." }, { status: 500 });
  }
}
