import { expiredReliefSessionCookie, revokeCurrentReliefSession } from "../../../../lib/relief-session";
import { authRedirect, isAllowedAuthOrigin } from "../../../../lib/auth-request";

export async function POST(request: Request) {
  if (!isAllowedAuthOrigin(request)) return new Response("Origine non autorisée.", { status: 403 });
  await revokeCurrentReliefSession();
  const response = Response.redirect(authRedirect("/"), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.append("Set-Cookie", expiredReliefSessionCookie());
  return response;
}
