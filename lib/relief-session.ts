import { cookies } from "next/headers";
import {
  createAuthSessionRecord,
  getAuthSessionRecord,
  revokeAuthSessionRecord,
} from "../db/commercial";

const COOKIE_NAME = "__Host-relief_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type ReliefSession = {
  email: string;
  fullName: string | null;
};

function base64UrlEncode(value: string) {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  return atob(padded);
}

function secret() {
  const value = process.env.RELIEF_SESSION_SECRET?.trim() ?? "";
  return value.length >= 32 ? value : null;
}

export function isReliefSessionReady() {
  return secret() !== null;
}

async function signature(value: string, signingSecret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(digest)));
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export async function createReliefSession(input: ReliefSession) {
  const signingSecret = secret();
  if (!signingSecret) throw new Error("Session Relief non configurée.");
  const sessionId = await createAuthSessionRecord({
    email: input.email,
    fullName: input.fullName,
    ttlSeconds: SESSION_TTL_SECONDS,
  });
  const payload = base64UrlEncode(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1_000) + SESSION_TTL_SECONDS,
      sessionId,
    }),
  );
  return `${payload}.${await signature(payload, signingSecret)}`;
}

export async function getReliefSession(): Promise<ReliefSession | null> {
  const signingSecret = secret();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!signingSecret || !token) return null;
  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return null;
  if (!equal(await signature(payload, signingSecret), receivedSignature)) return null;
  try {
    const value = JSON.parse(base64UrlDecode(payload)) as {
      exp?: unknown;
      sessionId?: unknown;
    };
    if (
      typeof value.sessionId !== "string" ||
      typeof value.exp !== "number" ||
      value.exp < Math.floor(Date.now() / 1_000)
    ) return null;
    const record = await getAuthSessionRecord(value.sessionId);
    if (!record) return null;
    return {
      email: record.email.toLowerCase(),
      fullName: record.full_name,
    };
  } catch {
    return null;
  }
}

export async function revokeCurrentReliefSession() {
  const signingSecret = secret();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!signingSecret || !token) return;
  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return;
  if (!equal(await signature(payload, signingSecret), receivedSignature)) return;
  try {
    const value = JSON.parse(base64UrlDecode(payload)) as { sessionId?: unknown };
    if (typeof value.sessionId === "string") {
      await revokeAuthSessionRecord(value.sessionId);
    }
  } catch {
    return;
  }
}

export function reliefSessionCookie(value: string) {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; Secure`;
}

export function expiredReliefSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}
