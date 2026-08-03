import { activateTrialForEmail, findTrialByEmail, saveOnboarding } from "../../../db/commercial";
import { isAllowedAuthOrigin, privateJson, readAuthJson } from "../../../lib/auth-request";
import { getChatGPTUser } from "../../chatgpt-auth";

const ROLES = new Set(["owner", "marketing", "consultant", "agency"]);
const OBJECTIVES = new Set(["citations", "recommendations", "competition", "client"]);

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

function list(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value.map((item) => clean(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return privateJson({ error: "Authentification requise." }, { status: 401 });
  if (!isAllowedAuthOrigin(request)) return privateJson({ error: "Origine non autorisée." }, { status: 403 });
  try {
    const body = await readAuthJson(request);
    const companyName = clean(body.companyName, 120);
    const domain = clean(body.domain, 180).toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const country = clean(body.country, 80);
    const sector = clean(body.sector, 100);
    const role = clean(body.role, 30);
    const objective = clean(body.objective, 30);
    const questions = list(body.questions, 5, 180);
    const competitors = list(body.competitors, 4, 100);
    if (companyName.length < 2 || !/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(domain) || !country || !sector || !ROLES.has(role) || !OBJECTIVES.has(objective) || questions.length < 3) {
      return privateJson({ error: "Complétez les quatre étapes avant de lancer le diagnostic." }, { status: 400 });
    }
    const trial = await findTrialByEmail(user.email);
    if (!trial || !["requested", "trialing"].includes(trial.status)) return privateJson({ error: "Aucun espace Découverte ne peut être configuré avec ce compte." }, { status: 409 });
    await saveOnboarding({ companyName, competitors, country, domain, email: user.email, objective, questions, role, sector });
    if (trial.status === "requested") await activateTrialForEmail(user.email, user.displayName, companyName);
    return privateJson({ ok: true, redirect: "/espace?onboarding=complete" });
  } catch {
    return privateJson({ error: "L’onboarding n’a pas pu être enregistré." }, { status: 500 });
  }
}
