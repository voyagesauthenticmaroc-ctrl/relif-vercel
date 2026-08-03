"use client";

import { FormEvent, useEffect, useState } from "react";
import { RELIEF_PLANS, type PlanCode } from "../../lib/plans";

export function SignupForm({
  initialPlan = "consultant",
}: {
  initialPlan?: PlanCode;
}) {
  const [planCode, setPlanCode] = useState<PlanCode>(initialPlan);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const plan =
    RELIEF_PLANS.find((item) => item.code === planCode) ?? RELIEF_PLANS[1];

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", {
        body: JSON.stringify({
          companyName: form.get("companyName"),
          email: form.get("email"),
          fullName: form.get("fullName"),
          planCode,
          profile: form.get("profile"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de créer votre espace.");
      }
      setEmail(String(form.get("email") ?? ""));
      setMessage(
        payload.message ?? "Vérifiez votre boîte e-mail pour continuer.",
      );
      setCooldown(45);
      setState("sent");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer votre espace.",
      );
      setState("error");
    }
  }

  async function resend() {
    if (cooldown) return;
    setCooldown(45);
    const response = await fetch("/api/auth/request-link", {
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message ?? "Un nouveau lien vient d’être demandé.");
  }

  if (state === "sent") {
    return (
      <section className="signup-confirm">
        <span>01 · Adresse e-mail</span>
        <h2>Vérifiez votre boîte de réception.</h2>
        <p>{message}</p>
        <strong className="signup-sent-email">
          {email.replace(/^(.{2}).*(@.*)$/, "$1••••$2")}
        </strong>
        <small>
          Le lien est personnel et valable 24 heures. Il vous ouvrira directement
          votre espace Relief.
        </small>
        <div className="signup-confirm-actions">
          <button
            className="button button-outline"
            disabled={cooldown > 0}
            onClick={resend}
            type="button"
          >
            {cooldown ? `Renvoyer dans ${cooldown} s` : "Renvoyer le lien"}
          </button>
          <button
            onClick={() => {
              setState("idle");
              setMessage("");
            }}
            type="button"
          >
            Changer d’adresse
          </button>
        </div>
      </section>
    );
  }

  return (
    <form className="signup-form" onSubmit={submit}>
      <div className="signup-plan">
        <div>
          <span>Votre point de départ</span>
          <strong>{plan.name}</strong>
          <p>{plan.description}</p>
        </div>
        <select
          value={planCode}
          onChange={(event) => setPlanCode(event.target.value as PlanCode)}
          aria-label="Choisir l’offre"
        >
          <option value="solo">Solo</option>
          <option value="consultant">Expert</option>
          <option value="agency">Agence</option>
        </select>
      </div>
      <label>
        Nom et prénom
        <input
          name="fullName"
          autoComplete="name"
          minLength={2}
          required
          placeholder="Sofiane Belmahi"
        />
      </label>
      <label>
        E-mail professionnel
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@entreprise.fr"
        />
      </label>
      <label>
        Entreprise ou marque à analyser
        <input
          name="companyName"
          autoComplete="organization"
          minLength={2}
          required
          placeholder="Nom de votre entreprise"
        />
      </label>
      <label>
        Votre rôle
        <select name="profile" defaultValue={planCode}>
          <option value="solo">Dirigeant ou indépendant</option>
          <option value="consultant">Consultant, commercial ou marketing</option>
          <option value="agency">Agence ou équipe</option>
        </select>
      </label>
      {message && (
        <p className="signup-error" role="alert">
          {message}
        </p>
      )}
      <button
        className="button button-hero"
        disabled={state === "sending"}
        type="submit"
      >
        {state === "sending"
          ? "Préparation de votre espace…"
          : `Créer mon espace ${plan.name}`}
      </button>
      <p className="signup-legal">
        Sans carte bancaire. Vous accédez d’abord à votre espace Découverte et à
        votre premier diagnostic. En continuant, vous acceptez les{" "}
        <a href="/cgv">conditions</a> et la{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </form>
  );
}
