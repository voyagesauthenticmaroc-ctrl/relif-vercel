import { consumeEmailVerificationLink } from "../../../../db/commercial";
import { authRedirect, isAllowedAuthOrigin } from "../../../../lib/auth-request";
import { createReliefSession, isReliefSessionReady, reliefSessionCookie } from "../../../../lib/relief-session";

export async function POST(request: Request) {
  if (!isAllowedAuthOrigin(request)) return new Response("Origine non autorisée.", { status: 403 });
  if (!isReliefSessionReady()) return new Response("Connexion en cours d’activation.", { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 8_192) {
    return new Response("Demande trop volumineuse.", { status: 413 });
  }
  const form = await request.formData();
  const rawToken = form.get("token");
  const verified = await consumeEmailVerificationLink(typeof rawToken === "string" ? rawToken : "");
  if (!verified) return Response.redirect(authRedirect("/inscription?verification=invalid"), 303);
  const session = await createReliefSession({ email: verified.email, fullName: verified.full_name });
  const response = Response.redirect(authRedirect("/espace?onboarding=1"), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.append("Set-Cookie", reliefSessionCookie(session));
  return response;
}
