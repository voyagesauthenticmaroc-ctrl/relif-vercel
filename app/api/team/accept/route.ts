import { acceptWorkspaceInvitation } from "../../../../db/commercial";
import {
  authRedirect,
  isAllowedAuthOrigin,
} from "../../../../lib/auth-request";
import {
  createReliefSession,
  isReliefSessionReady,
  reliefSessionCookie,
} from "../../../../lib/relief-session";

export async function POST(request: Request) {
  if (!isAllowedAuthOrigin(request)) {
    return new Response("Origine non autorisée.", { status: 403 });
  }
  if (!isReliefSessionReady()) {
    return new Response("Connexion en cours d’activation.", { status: 503 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 8_192) {
    return new Response("Demande trop volumineuse.", { status: 413 });
  }
  const form = await request.formData();
  const token = form.get("token");
  const fullName = form.get("fullName");
  const cleanName =
    typeof fullName === "string"
      ? fullName.replace(/\s+/g, " ").trim().slice(0, 100)
      : "";
  if (cleanName.length < 2) {
    return Response.redirect(authRedirect("/invitation?status=invalid"), 303);
  }
  const accepted = await acceptWorkspaceInvitation({
    fullName: cleanName,
    token: typeof token === "string" ? token : "",
  });
  if (!accepted) {
    return Response.redirect(authRedirect("/invitation?status=invalid"), 303);
  }
  const session = await createReliefSession(accepted);
  const response = Response.redirect(authRedirect("/espace"), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.append("Set-Cookie", reliefSessionCookie(session));
  return response;
}
