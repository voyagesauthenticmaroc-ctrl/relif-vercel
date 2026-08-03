"use client";

import { FormEvent, useState } from "react";

export function InviteMemberForm({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/team/invite", {
        body: JSON.stringify({
          email: form.get("email"),
          role: form.get("role"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Invitation impossible.");
      }
      setMessage(payload.message ?? "Invitation envoyée.");
      event.currentTarget.reset();
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Invitation impossible.",
      );
    } finally {
      setStatus((current) => (current === "error" ? "error" : "idle"));
    }
  }

  return (
    <form className="team-invite-form" onSubmit={submit}>
      <label>
        Adresse e-mail
        <input
          disabled={disabled}
          name="email"
          type="email"
          required
          placeholder="collaborateur@agence.fr"
        />
      </label>
      <label>
        Rôle
        <select disabled={disabled} name="role" defaultValue="analyst">
          <option value="admin">Administrateur</option>
          <option value="analyst">Analyste</option>
          <option value="viewer">Lecture seule</option>
        </select>
      </label>
      <button
        className="button button-outline"
        disabled={disabled || status === "sending"}
        type="submit"
      >
        {status === "sending" ? "Envoi…" : "Inviter"}
      </button>
      {message && (
        <p className={status === "error" ? "signup-error" : ""} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
