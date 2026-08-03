"use client";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); const email = new FormData(event.currentTarget).get("email"); try { const response = await fetch("/api/auth/request-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const data = await response.json() as { error?: string; message?: string }; setMessage(data.message ?? data.error ?? "Vérifiez votre boîte e-mail."); } finally { setLoading(false); } }
  return <form className="signup-form" onSubmit={submit}><label>E-mail professionnel<input name="email" type="email" required autoComplete="email" placeholder="vous@entreprise.fr" /></label><button className="button button-hero" disabled={loading}>{loading ? "Envoi…" : "Recevoir mon lien sécurisé"}</button>{message && <p className="signup-legal" role="status">{message}</p>}</form>;
}
