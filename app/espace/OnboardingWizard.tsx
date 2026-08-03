"use client";

import { FormEvent, useMemo, useState } from "react";

const steps = ["Votre rôle", "Votre marque", "Votre objectif", "Vos questions"] as const;

export function OnboardingWizard({ defaultCompanyName }: { defaultCompanyName: string }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sector, setSector] = useState("");
  const suggestions = useMemo(() => {
    const activity = sector || "mon secteur";
    return [
      `Quelles sont les meilleures entreprises de ${activity} en France ?`,
      `Quelle entreprise recommander pour un projet de ${activity} ?`,
      `Comment choisir un prestataire fiable dans ${activity} ?`,
    ];
  }, [sector]);

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateVisible(event.currentTarget)) return;
    setStep((value) => Math.min(3, value + 1));
  }

  async function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateVisible(event.currentTarget)) return;
    setStatus("saving");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/onboarding", {
        body: JSON.stringify({
          companyName: form.get("companyName"),
          competitors: [form.get("competitor1"), form.get("competitor2")],
          country: form.get("country"),
          domain: form.get("domain"),
          objective: form.get("objective"),
          questions: [form.get("question1"), form.get("question2"), form.get("question3")],
          role: form.get("role"),
          sector: form.get("sector"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossible de finaliser votre espace.");
      window.location.assign(payload.redirect ?? "/espace");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Impossible de finaliser votre espace.");
    }
  }

  function validateVisible(form: HTMLFormElement) {
    const current = form.querySelector<HTMLElement>(
      ".onboarding-fields:not([hidden])",
    );
    const fields = current
      ? Array.from(
          current.querySelectorAll<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >("input, select, textarea"),
        )
      : [];
    const invalid = fields.find((field) => !field.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    invalid.focus();
    return false;
  }

  return (
    <section className="onboarding-panel">
      <div className="onboarding-progress" aria-label={`Étape ${step + 1} sur 4`}>
        {steps.map((label, index) => <span className={index <= step ? "is-active" : ""} key={label}><i>{index + 1}</i><b>{label}</b></span>)}
      </div>
      <form noValidate onSubmit={step === 3 ? finish : next}>
        <div className="onboarding-copy">
          <span>Étape {step + 1} sur 4</span>
          <h2>{step === 0 ? "Quel regard allez-vous porter sur les résultats ?" : step === 1 ? "Quelle marque Relief doit-il observer ?" : step === 2 ? "Quel résultat compte le plus pour vous ?" : "Commençons par les questions de vos prospects."}</h2>
          <p>{step === 0 ? "Cela adapte le niveau de lecture et les prochaines actions proposées." : step === 1 ? "Le domaine, le marché et le secteur permettent de cadrer les réponses observées." : step === 2 ? "Relief organisera le diagnostic autour de cette priorité." : "Vous pourrez modifier ces questions plus tard dans l’application."}</p>
        </div>

        <div hidden={step !== 0} className="onboarding-fields choice-grid">
          {[['owner','Dirigeant','Comprendre la visibilité de mon entreprise'],['marketing','Marketing','Piloter la présence de ma marque'],['consultant','Consultant','Préparer et livrer des audits'],['agency','Agence','Suivre un portefeuille de clients']].map(([value,title,copy]) => <label className="choice-card" key={value}><input defaultChecked={value === "consultant"} name="role" type="radio" value={value} required /><span><b>{title}</b><small>{copy}</small></span></label>)}
        </div>
        <div hidden={step !== 1} className="onboarding-fields">
          <label>Marque ou entreprise<input defaultValue={defaultCompanyName} name="companyName" required minLength={2} /></label>
          <label>Domaine officiel<input name="domain" required placeholder="votreentreprise.fr" /></label>
          <div className="onboarding-row"><label>Marché principal<select name="country" defaultValue="France"><option>France</option><option>Belgique</option><option>Suisse</option><option>Canada</option><option>International</option></select></label><label>Secteur d’activité<input name="sector" required value={sector} onChange={(event) => setSector(event.target.value)} placeholder="Communication, immobilier…" /></label></div>
        </div>
        <div hidden={step !== 2} className="onboarding-fields choice-grid">
          {[['citations','Être davantage cité','Mesurer quand et comment ma marque apparaît'],['recommendations','Être recommandé','Comprendre les critères qui font émerger une marque'],['competition','Comparer mes concurrents','Voir qui occupe l’espace à ma place'],['client','Convaincre un client','Produire un diagnostic clair et partageable']].map(([value,title,copy]) => <label className="choice-card" key={value}><input defaultChecked={value === "citations"} name="objective" type="radio" value={value} required /><span><b>{title}</b><small>{copy}</small></span></label>)}
          <div className="onboarding-row full"><label>Concurrent principal <small>facultatif</small><input name="competitor1" placeholder="Nom d’un concurrent" /></label><label>Autre concurrent <small>facultatif</small><input name="competitor2" placeholder="Nom d’un concurrent" /></label></div>
        </div>
        <div hidden={step !== 3} className="onboarding-fields question-list">
          {suggestions.map((suggestion, index) => <label key={`${sector}-${index}`}>Question {index + 1}<textarea defaultValue={suggestion} name={`question${index + 1}`} required minLength={12} /></label>)}
        </div>
        {message && <p className="onboarding-error" role="alert">{message}</p>}
        <div className="onboarding-actions">
          {step > 0 && <button className="button button-outline" onClick={() => setStep((value) => value - 1)} type="button">Retour</button>}
          <button className="button button-hero" disabled={status === "saving"} type="submit">{status === "saving" ? "Préparation…" : step === 3 ? "Préparer mon premier diagnostic" : "Continuer"}</button>
        </div>
      </form>
    </section>
  );
}
