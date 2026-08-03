import { allowAuthLinkRequest, createEmailVerificationLink, findTrialByEmail } from "../../../../db/commercial";
import { authRedirect, isAllowedAuthOrigin, privateJson, readAuthJson, requestIp } from "../../../../lib/auth-request";
import { isReliefEmailReady, sendVerificationEmail } from "../../../../lib/relief-email";
import { isReliefSessionReady } from "../../../../lib/relief-session";

export async function POST(request: Request) {
  try {
    if (!isAllowedAuthOrigin(request)) return privateJson({ error: "Origine non autorisée." }, { status: 403 });
    if (!isReliefSessionReady() || !isReliefEmailReady()) return privateJson({ error: "La connexion par e-mail est en cours d’activation." }, { status: 503 });
    const { email } = await readAuthJson(request);
    const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return privateJson({ error: "Saisissez une adresse e-mail valide." }, { status: 400 });
    const rateSecret = process.env.TRIAL_RATE_LIMIT_SECRET?.trim() ?? "";
    if (rateSecret.length < 32) {
      return privateJson(
        { error: "La protection des connexions est en cours d’activation." },
        { status: 503 },
      );
    }
    const [emailAllowed, ipAllowed] = await Promise.all([
      allowAuthLinkRequest({ cooldownSeconds: 45, identifier: `login-email:${normalized}`, limit: 5, secret: rateSecret }),
      allowAuthLinkRequest({ cooldownSeconds: 2, identifier: `login-ip:${requestIp(request)}`, limit: 20, secret: rateSecret }),
    ]);
    if (!emailAllowed || !ipAllowed) return privateJson({ ok: true, message: "Si un espace est associé à cette adresse, un lien sécurisé vient de vous être envoyé." });
    const trial = await findTrialByEmail(normalized);
    if (trial) {
      const token = await createEmailVerificationLink({ email: normalized, fullName: trial.full_name });
      await sendVerificationEmail({ email: normalized, name: trial.full_name, url: authRedirect(`/verification?token=${encodeURIComponent(token)}`) });
    }
    return privateJson({ ok: true, message: "Si un espace est associé à cette adresse, un lien sécurisé vient de vous être envoyé." });
  } catch { return privateJson({ error: "Impossible d’envoyer le lien pour le moment." }, { status: 500 }); }
}
