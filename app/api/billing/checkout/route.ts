import {
  completeCheckoutSession,
  failCheckoutSession,
  findTrialByEmail,
  getCommercialEntitlement,
  reserveCheckoutSession,
  upsertTrialRequest,
} from "../../../../db/commercial";
import {
  getPlan,
  isBillingCycle,
} from "../../../../lib/plans";
import {
  getStripeSecretKey,
  stripePost,
  StripeApiError,
} from "../../../../lib/stripe";
import { getChatGPTUser } from "../../../chatgpt-auth";

const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_SIZE = 4_096;

type StripeCheckoutSession = {
  expires_at: number;
  id: string;
  url: string | null;
};

function json(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.hostname === "localhost") {
        return url.origin;
      }
    } catch {
      // Fall back to the public request URL.
    }
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return json(
      { error: "Connectez-vous avant de choisir une offre." },
      { status: 401 },
    );
  }

  const requestUrlOrigin = new URL(request.url).origin;
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== requestUrlOrigin) {
    return json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return json({ error: "Corps trop volumineux." }, { status: 413 });
  }

  let body: {
    billingCycle?: unknown;
    idempotencyKey?: unknown;
    planCode?: unknown;
  };
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return json({ error: "Corps trop volumineux." }, { status: 413 });
    }
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return json({ error: "Demande JSON invalide." }, { status: 400 });
  }

  const planCode =
    typeof body.planCode === "string" ? body.planCode.trim() : "";
  const billingCycle =
    typeof body.billingCycle === "string" ? body.billingCycle : "";
  const idempotencyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
  const plan = getPlan(planCode);

  if (!plan || !isBillingCycle(billingCycle)) {
    return json({ error: "Offre ou facturation inconnue." }, { status: 400 });
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return json(
      { error: "La demande de paiement n’est pas valide." },
      { status: 400 },
    );
  }

  try {
    const existingEntitlement = await getCommercialEntitlement(user.email);
    const terminalBillingStatus =
      existingEntitlement?.billingStatus === "canceled" ||
      existingEntitlement?.billingStatus === "incomplete_expired";
    if (
      existingEntitlement?.stripeSubscriptionId &&
      !terminalBillingStatus
    ) {
      return json(
        {
          error:
            "Un abonnement existe déjà pour ce compte. Ouvrez la gestion de facturation pour le modifier.",
          manageBilling: true,
        },
        { status: 409 },
      );
    }

    if (!getStripeSecretKey()) {
      return json(
        {
          error:
            "Le paiement en ligne n’est pas encore activé pour cette offre.",
        },
        { status: 503 },
      );
    }

    const priceId = process.env[plan.stripePriceEnv[billingCycle]]?.trim();
    if (!priceId?.startsWith("price_")) {
      return json(
        {
          error:
            "Cette offre n’est pas encore disponible au paiement en ligne.",
        },
        { status: 503 },
      );
    }

    const reservation = await reserveCheckoutSession({
      billingCycle,
      email: user.email,
      id: idempotencyKey,
      planCode: plan.code,
    });
    if (reservation.kind === "ready") {
      return json({ reused: reservation.reused, url: reservation.url });
    }
    if (reservation.kind === "rate_limited") {
      return json(
        {
          error:
            "Plusieurs paiements ont déjà été ouverts. Réessayez dans quelques minutes.",
        },
        { status: 429 },
      );
    }
    if (reservation.kind === "pending") {
      return json(
        {
          error:
            "Cette demande est déjà en cours. Patientez quelques secondes avant de réessayer.",
        },
        { status: 409 },
      );
    }

    const trial = await findTrialByEmail(user.email);
    if (!trial) {
      await upsertTrialRequest({
        companyName: `Espace de ${user.displayName}`,
        email: user.email,
        expectedMonthlyMeasures: plan.measures,
        fullName: user.displayName,
        planCode: plan.code,
        profile: plan.code,
      });
    }

    const origin = appOrigin(request);
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("payment_method_types[0]", "card");
    params.set("client_reference_id", idempotencyKey);
    if (existingEntitlement?.stripeCustomerId) {
      params.set("customer", existingEntitlement.stripeCustomerId);
      params.set("customer_update[address]", "auto");
      params.set("customer_update[name]", "auto");
    } else {
      params.set("customer_email", user.email);
    }
    params.set("line_items[0][price]", priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("allow_promotion_codes", "true");
    params.set("billing_address_collection", "auto");
    params.set("tax_id_collection[enabled]", "true");
    params.set("locale", "fr");
    params.set("metadata[plan_code]", plan.code);
    params.set("metadata[user_email]", user.email);
    params.set("metadata[checkout_request_id]", idempotencyKey);
    params.set("subscription_data[metadata][plan_code]", plan.code);
    params.set("subscription_data[metadata][user_email]", user.email);
    params.set(
      "success_url",
      `${origin}/espace?checkout=success&plan=${plan.code}&cycle=${billingCycle}`,
    );
    params.set(
      "cancel_url",
      `${origin}/espace?checkout=cancelled&plan=${plan.code}&cycle=${billingCycle}`,
    );
    params.set("expires_at", String(Math.floor(Date.now() / 1_000) + 1_865));

    const session = await stripePost<StripeCheckoutSession>(
      "/v1/checkout/sessions",
      params,
      { idempotencyKey: `relief-checkout-${idempotencyKey}` },
    );
    if (!session.id || !session.url || !session.expires_at) {
      throw new Error("Stripe Checkout returned an incomplete session");
    }

    await completeCheckoutSession({
      email: user.email,
      expiresAt: session.expires_at,
      id: idempotencyKey,
      stripeSessionId: session.id,
      url: session.url,
    });

    return json({ reused: false, url: session.url });
  } catch (error) {
    await failCheckoutSession(idempotencyKey, user.email).catch(() => undefined);
    console.error("[relief-commercial] checkout route failed", {
      code: error instanceof StripeApiError ? error.code : null,
      message: error instanceof Error ? error.message : "Unknown error",
      requestId: error instanceof StripeApiError ? error.requestId : null,
    });
    return json(
      {
        error:
          "Le paiement n’a pas pu être ouvert. Aucun débit n’a été effectué.",
      },
      {
        status:
          error instanceof StripeApiError && error.status === 504 ? 504 : 502,
      },
    );
  }
}
