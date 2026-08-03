import { SITE_URL, siteUrl } from "./site-url";

export const MAX_AUTH_BODY_BYTES = 8_192;

export function authRedirect(path: string) {
  return siteUrl(path);
}

export function isAllowedAuthOrigin(request: Request) {
  const received = request.headers.get("origin");
  if (!received) return process.env.NODE_ENV !== "production";
  if (received === SITE_URL) return true;
  try {
    const requestUrl = new URL(request.url);
    const local = ["localhost", "127.0.0.1"].includes(requestUrl.hostname);
    return local && received === requestUrl.origin;
  } catch {
    return false;
  }
}

export function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  ).trim().slice(0, 80);
}

export async function readAuthJson(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_AUTH_BODY_BYTES) throw new AuthBodyError("too_large");
  const raw = await request.text();
  if (raw.length > MAX_AUTH_BODY_BYTES) throw new AuthBodyError("too_large");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new AuthBodyError("invalid_json");
  }
}

export class AuthBodyError extends Error {
  constructor(readonly reason: "invalid_json" | "too_large") {
    super(reason);
  }
}

export function privateJson(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(payload, { ...init, headers });
}
