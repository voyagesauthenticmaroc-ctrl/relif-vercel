import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCommercialEntitlement, getOnboardingByEmail } from "../../../db/commercial";
import { requireChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Premier diagnostic", robots: { index: false, follow: false } };

function list(value?: string) { try { const parsed = JSON.parse(value ?? "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }

export default async function DiagnosticPage() {
  const user = await requireChatGPTUser("/espace/diagnostic");
  const [setup, entitlement] = await Promise.all([getOnboardingByEmail(user.email), getCommercialEntitlement(user.email)]);
  const questions = list(setup?.questions_json);
  const reliefAppUrl = process.env.NEXT_PUBLIC_RELIEF_APP_URL?.trim() || null;
  return <main className="diagnostic-page"><header className="unlock-header"><Link href="/espace"><Image src="/relief-visibility-os-lockup-on-dark.png" alt="Relief Visibility OS" width={626} height={141} unoptimized /></Link><Link href="/espace">Retour au tableau de bord</Link></header><section className="diagnostic-shell"><div className="diagnostic-heading"><span>Premier diagnostic</span><h1>{setup ? `${setup.company_name} est prête à être observée.` : "Terminez la configuration de votre marque."}</h1><p>{setup ? `Relief utilisera le marché ${setup.country}, le secteur ${setup.sector} et votre objectif principal pour cadrer les réponses.` : "Votre espace doit connaître la marque, son domaine et les questions à analyser."}</p></div>{setup ? <div className="diagnostic-layout"><article className="diagnostic-preflight"><div className="preflight-top"><span>Configuration validée</span><b>{entitlement?.limit ? `${Math.max(0,entitlement.limit-entitlement.used)} mesures disponibles` : "Accès Découverte"}</b></div><dl><div><dt>Marque</dt><dd>{setup.company_name}</dd></div><div><dt>Domaine</dt><dd>{setup.domain}</dd></div><div><dt>Marché</dt><dd>{setup.country}</dd></div><div><dt>Objectif</dt><dd>{setup.objective}</dd></div></dl><div className="diagnostic-questions"><span>Questions préparées</span>{questions.map((question,index) => <p key={question}><i>{String(index+1).padStart(2,"0")}</i>{question}</p>)}</div></article><aside className="diagnostic-launch"><span>Passage vers Visibility OS</span><h2>Lancez l’observation dans l’outil.</h2><p>Le site commercial transmet votre accès et vos limites. Les réponses, citations et sources sont ensuite produites dans l’application Visibility OS.</p>{reliefAppUrl && entitlement?.access ? <a className="button button-hero" href={reliefAppUrl}>Ouvrir Visibility OS <b>→</b></a> : <><button className="button button-hero" disabled>Connexion de l’application en attente</button><small>L’adresse sécurisée de l’application doit encore être renseignée avant de pouvoir lancer de vraies mesures.</small></>}<Link href="/espace/debloquer?reason=plan">Voir ce que débloquent les formules</Link></aside></div> : <div className="diagnostic-empty"><p>Votre configuration n’est pas encore terminée.</p><Link className="button button-hero" href="/espace">Reprendre l’onboarding</Link></div>}</section></main>;
}
