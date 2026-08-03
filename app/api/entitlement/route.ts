import {
  consumeCommercialUsage,
  getCommercialEntitlement,
} from "../../../db/commercial";
import { getChatGPTUser } from "../../chatgpt-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,120}$/;
const MAX_BODY_SIZE = 4_096;

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function json(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) {
    return json({ error: "Authentification requise." }, { status: 401 });
  }

  const entitlement = await getCommercialEntitlement(user.email);
  return json({ entitlement, ok: true });
}

export async function POST(request: Request) {
  const configuredSecret =
    process.env.RELIEF_ENTITLEMENT_API_SECRET?.trim() ?? "";
  if (configuredSecret.length < 32) {
    return json(
      { error: "Le contrôle d’accès serveur n’est pas configuré." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!providedSecret || !secureEqual(providedSecret, configuredSecret)) {
    return json({ error: "Accès refusé." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return json({ error: "Corps trop volumineux." }, { status: 413 });
  }

  let body: {
    action?: unknown;
    amount?: unknown;
    email?: unknown;
    idempotencyKey?: unknown;
  };
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return json({ error: "Corps trop volumineux." }, { status: 413 });
    }
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  const action = body.action === undefined ? "check" : body.action;
  if (action !== "check" && action !== "consume") {
    return json({ error: "Action inconnue." }, { status: 400 });
  }

  if (action === "consume") {
    const amount = Number(body.amount ?? 1);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      return json(
        { error: "Le nombre de mesures doit être compris entre 1 et 100." },
        { status: 400 },
      );
    }
    const idempotencyKey =
      typeof body.idempotencyKey === "string"
        ? body.idempotencyKey.trim()
        : "";
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return json(
        {
          error:
            "Une clé d’idempotence stable est requise pour consommer des mesures.",
        },
        { status: 400 },
      );
    }
    const result = await consumeCommercialUsage(
      email,
      amount,
      idempotencyKey,
    );
    return json({
      allowed: result.consumed,
      consumed: result.consumed ? amount : 0,
      entitlement: result.entitlement,
      ok: true,
      reason: result.reason,
      replayed: result.consumed ? result.replayed : false,
    });
  }

  const entitlement = await getCommercialEntitlement(email);
  return json({
    allowed: Boolean(entitlement?.access && !entitlement.readOnly),
    entitlement,
    ok: true,
  });
}
