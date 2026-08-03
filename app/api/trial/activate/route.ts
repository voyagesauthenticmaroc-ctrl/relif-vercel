import {
  activateTrialForEmail,
  findTrialByEmail,
} from "../../../../db/commercial";
import { getChatGPTUser } from "../../../chatgpt-auth";

const MAX_BODY_SIZE = 2_048;

function json(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return json({ error: "Authentification requise." }, { status: 401 });
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) {
    return json({ error: "Origine non autorisée." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return json({ error: "Corps trop volumineux." }, { status: 413 });
  }

  let body: { companyName?: unknown };
  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return json({ error: "Corps trop volumineux." }, { status: 413 });
    }
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return json({ error: "Demande JSON invalide." }, { status: 400 });
  }

  const companyName =
    typeof body.companyName === "string"
      ? body.companyName.trim().slice(0, 120)
      : "";
  if (companyName.length < 2) {
    return json(
      { error: "Confirmez le nom de l’entreprise à analyser." },
      { status: 400 },
    );
  }

  const trial = await findTrialByEmail(user.email);
  if (!trial) {
    return json(
      { error: "Aucune demande d’essai n’est associée à ce compte." },
      { status: 404 },
    );
  }
  if (trial.status === "trialing") {
    return json({ ok: true, alreadyActive: true });
  }
  if (trial.status !== "requested") {
    return json(
      { error: "Cet essai ne peut plus être activé." },
      { status: 409 },
    );
  }

  await activateTrialForEmail(user.email, user.displayName, companyName);
  return json({ ok: true });
}
