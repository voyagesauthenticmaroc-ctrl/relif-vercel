"use client";

import { useState } from "react";
import type { BillingCycle } from "../../lib/plans";

type ActionStatus = "idle" | "loading" | "error";

async function readPayload(response: Response) {
  try {
    return (await response.json()) as {
      error?: string;
      url?: string;
    };
  } catch {
    return {};
  }
}

function useBillingRedirect() {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState("");

  async function redirectToBilling(
    endpoint: string,
    body?: Record<string, string>,
  ) {
    setStatus("loading");
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(endpoint, {
        body: body ? JSON.stringify(body) : undefined,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        method: "POST",
        signal: controller.signal,
      });
      const payload = await readPayload(response);
      if (!response.ok || !payload.url) {
        throw new Error(
          payload.error ??
            "Le service de facturation ne répond pas pour le moment.",
        );
      }
      window.location.assign(payload.url);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "La connexion à Stripe prend plus de temps que prévu. Réessayez."
          : error instanceof Error
            ? error.message
            : "Une erreur est survenue.",
      );
    } finally {
      window.clearTimeout(timeout);
      setStatus((current) => (current === "error" ? "error" : "idle"));
    }
  }

  return { message, redirectToBilling, status };
}

export function CheckoutButton({
  billingCycle,
  planCode,
}: {
  billingCycle: BillingCycle;
  planCode: string;
}) {
  const { message, redirectToBilling, status } = useBillingRedirect();

  return (
    <div className="checkout-action">
      <button
        className="button"
        type="button"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        onClick={() =>
          redirectToBilling("/api/billing/checkout", {
            billingCycle,
            idempotencyKey: crypto.randomUUID(),
            planCode,
          })
        }
      >
        {status === "loading"
          ? "Ouverture du paiement sécurisé…"
          : "Choisir cette offre"}
      </button>
      <p aria-live="polite" role={status === "error" ? "alert" : undefined}>
        {status === "error" ? message : "Paiement sécurisé et géré par Stripe."}
      </p>
    </div>
  );
}

export function BillingPortalButton() {
  const { message, redirectToBilling, status } = useBillingRedirect();

  return (
    <div className="checkout-action">
      <button
        className="button button-outline"
        type="button"
        disabled={status === "loading"}
        aria-busy={status === "loading"}
        onClick={() => redirectToBilling("/api/billing/portal")}
      >
        {status === "loading"
          ? "Ouverture de votre facturation…"
          : "Gérer mon abonnement"}
      </button>
      {status === "error" && (
        <p aria-live="assertive" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
