import { getPlan } from "../../../lib/plans";
import {
  allowTrialRequest,
  upsertTrialRequest,
} from "../../../db/commercial";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PROFILES = new Set(["solo", "consultant", "agency"]);
const ALLOWED_VOLUMES = new Set([300, 1_500, 6_000, 12_000]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const requestOrigin = request.headers.get("origin");
    if (requestOrigin && requestOrigin !== origin) {
      return Response.json({ error: "Origine non autorisée." }, { status: 403 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 16_384) {
      return Response.json({ error: "Corps trop volumineux." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > 16_384) {
      return Response.json({ error: "Corps trop volumineux." }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
    }

    if (cleanText(body.website, 200)) {
      return Response.json({ ok: true }, { status: 201 });
    }

    const rateLimitSecret = process.env.TRIAL_RATE_LIMIT_SECRET?.trim() ?? "";
    if (rateLimitSecret.length < 32) {
      return Response.json(
        {
          error:
            "Les essais en ligne sont momentanément indisponibles. Réessayez plus tard.",
        },
        { status: 503 },
      );
    }
    const source = request.headers.get("cf-connecting-ip");
    if (!(await allowTrialRequest(source, rateLimitSecret))) {
      return Response.json(
        { error: "Trop de demandes. Réessayez dans une heure." },
        { status: 429 },
      );
    }

    const fullName = cleanText(body.fullName, 100);
    const companyName = cleanText(body.companyName, 120);
    const email = cleanText(body.email, 180).toLowerCase();
    const profile = cleanText(body.profile, 30);
    const planCode = cleanText(body.plan, 30);
    const expectedMonthlyMeasures = Number(body.expectedMonthlyMeasures);

    if (fullName.length < 2 || companyName.length < 2) {
      return Response.json(
        { error: "Renseignez votre nom et votre entreprise." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json(
        { error: "Utilisez une adresse e-mail valide." },
        { status: 400 },
      );
    }

    if (
      !ALLOWED_PROFILES.has(profile) ||
      !getPlan(planCode) ||
      !ALLOWED_VOLUMES.has(expectedMonthlyMeasures)
    ) {
      return Response.json(
        { error: "L’offre sélectionnée n’est pas valide." },
        { status: 400 },
      );
    }

    const trialReserved = await upsertTrialRequest({
      companyName,
      email,
      expectedMonthlyMeasures,
      fullName,
      planCode,
      profile,
    });

    if (!trialReserved) {
      return Response.json(
        {
          error:
            "Un essai ou un abonnement existe déjà pour cette adresse. Connectez-vous pour retrouver votre espace.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        ok: true,
        message:
          "Votre essai est réservé. Connectez-vous avec la même adresse pour activer vos 60 mesures.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[relief-commercial] trial request failed", error);
    return Response.json(
      {
        error:
          "L’accès d’essai n’a pas pu être créé. Réessayez dans quelques instants.",
      },
      { status: 500 },
    );
  }
}
