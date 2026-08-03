import { getCommercialEntitlement } from "../../../../db/commercial";
import {
  getStripeSecretKey,
  stripePost,
  StripeApiError,
} from "../../../../lib/stripe";
import { getChatGPTUser } from "../../../chatgpt-auth";

type StripePortalSession = {
  id: string;
  url: string;
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
      // Use the public request URL instead.
    }
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return json(
      { error: "Connectez-vous pour gérer votre abonnement." },
      { status: 401 },
    );
  }

  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ error: "Origine non autorisée." }, { status: 403 });
  }

  try {
    const entitlement = await getCommercialEntitlement(user.email);
    if (!entitlement?.stripeCustomerId) {
      return json(
        { error: "Aucun compte de facturation n’est associé à cet espace." },
        { status: 404 },
      );
    }
    if (!getStripeSecretKey()) {
      return json(
        {
          error:
            "La gestion en ligne de l’abonnement n’est pas encore activée.",
        },
        { status: 503 },
      );
    }

    const params = new URLSearchParams({
      customer: entitlement.stripeCustomerId,
      locale: "fr",
      return_url: `${appOrigin(request)}/espace`,
    });
    const configurationId =
      process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
    if (configurationId?.startsWith("bpc_")) {
      params.set("configuration", configurationId);
    }

    const session = await stripePost<StripePortalSession>(
      "/v1/billing_portal/sessions",
      params,
    );
    if (!session.url) {
      throw new Error("Stripe Billing Portal returned no URL");
    }
    return json({ url: session.url });
  } catch (error) {
    console.error("[relief-commercial] billing portal failed", {
      code: error instanceof StripeApiError ? error.code : null,
      message: error instanceof Error ? error.message : "Unknown error",
      requestId: error instanceof StripeApiError ? error.requestId : null,
    });
    return json(
      {
        error:
          "La gestion de l’abonnement est momentanément indisponible. Réessayez dans quelques instants.",
      },
      {
        status:
          error instanceof StripeApiError && error.status === 504 ? 504 : 502,
      },
    );
  }
}
