"use client";

import { type FormEvent, useState } from "react";
import styles from "./TrialActivationForm.module.css";

export function TrialActivationForm({
  defaultCompanyName,
}: {
  defaultCompanyName: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/trial/activate", {
        body: JSON.stringify({
          companyName: form.get("companyName"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          payload.error ?? "L’essai n’a pas pu être activé.",
        );
      }
      window.location.reload();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "L’activation prend trop de temps. Réessayez dans un instant."
          : error instanceof Error
            ? error.message
            : "L’essai n’a pas pu être activé.",
      );
    } finally {
      window.clearTimeout(timeout);
      setStatus((current) => (current === "error" ? "error" : "idle"));
    }
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <span className="section-index">Dernière vérification</span>
      <h2>Confirmez l’entreprise de votre premier audit.</h2>
      <p>
        Vous êtes connecté avec la bonne adresse. Vérifiez simplement le nom
        du dossier avant d’activer votre premier espace Découverte.
      </p>
      <label htmlFor="trial-company-name">
        Entreprise ou projet
        <input
          autoComplete="organization"
          defaultValue={defaultCompanyName}
          id="trial-company-name"
          minLength={2}
          name="companyName"
          required
        />
      </label>
      {message && (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
      <button
        aria-busy={status === "loading"}
        className="button button-hero"
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading"
          ? "Activation en cours…"
          : "Activer mon accès Découverte"}
      </button>
    </form>
  );
}
