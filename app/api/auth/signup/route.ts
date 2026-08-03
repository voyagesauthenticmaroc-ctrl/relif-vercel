import { allowAuthLinkRequest, createEmailVerificationLink, upsertTrialRequest } from "../../../../db/commercial";
import { authRedirect, isAllowedAuthOrigin, privateJson, readAuthJson, requestIp } from "../../../../lib/auth-request";
import { isReliefEmailReady, sendVerificationEmail } from "../../../../lib/relief-email";
import { isReliefSessionReady } from "../../../../lib/relief-session";
import { getPlan } from "../../../../lib/plans";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILES = new Set(["solo", "consultant", "agency"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    if (!isAllowedAuthOrigin(request)) {
      return privateJson({ error: "Origine non autorisée." }, { status: 403 });
    }
    if (!isReliefSessionReady() || !isReliefEmailReady()) {
      return privateJson({ error: "La création de compte est en cours d’activation." }, { status: 503 });
    }
    const body = await readAuthJson(request);
    const fullName = text(body.fullName, 100);
    const email = text(body.email, 180).toLowerCase();
    const companyName = text(body.companyName, 120);
    const planCode = text(body.planCode, 30);
    const profile = text(body.profile, 30) || planCode;
    if (fullName.length < 2 || companyName.length < 2 || !EMAIL.test(email) || !getPlan(planCode) || !PROFILES.has(profile)) {
      return privateJson({ error: "Vérifiez votre nom, votre e-mail, votre entreprise et votre offre." }, { status: 400 });
    }
    const rateSecret = process.env.TRIAL_RATE_LIMIT_SECRET?.trim() ?? "";
    if (rateSecret.length < 32) {
      return privateJson(
        { error: "La protection des inscriptions est en cours d’activation." },
        { status: 503 },
      );
    }
    const [emailAllowed, ipAllowed] = await Promise.all([
      allowAuthLinkRequest({ cooldownSeconds: 45, identifier: `signup-email:${email}`, limit: 5, secret: rateSecret }),
      allowAuthLinkRequest({ cooldownSeconds: 2, identifier: `signup-ip:${requestIp(request)}`, limit: 20, secret: rateSecret }),
    ]);
    if (!emailAllowed || !ipAllowed) {
      return privateJson({ error: "Un lien vient déjà d’être demandé. Attendez un instant avant de réessayer." }, { status: 429 });
    }
    await upsertTrialRequest({
      companyName,
      email,
      expectedMonthlyMeasures: getPlan(planCode)?.measures ?? 300,
      fullName,
      planCode,
      profile,
    });
    const token = await createEmailVerificationLink({ email, fullName });
    const verificationUrl = authRedirect(`/verification?token=${encodeURIComponent(token)}`);
    const delivery = await sendVerificationEmail({ email, name: fullName, url: verificationUrl });
    return privateJson({
      delivered: delivery.delivered,
      ok: true,
      message: delivery.delivered
        ? "Vérifiez votre boîte e-mail pour continuer."
        : "L’e-mail n’a pas pu être remis. Réessayez dans quelques instants.",
    }, { status: 201 });
  } catch {
    return privateJson({ error: "La création du compte est momentanément indisponible." }, { status: 500 });
  }
}
