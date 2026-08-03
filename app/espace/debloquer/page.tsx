import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCommercialEntitlement } from "../../../db/commercial";
import { isBillingCheckoutReady } from "../../../lib/billing-readiness";
import { RELIEF_PLANS, getPlan, isBillingCycle } from "../../../lib/plans";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { CheckoutButton } from "../CheckoutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Débloquer Relief", robots: { index: false, follow: false } };

const reasons = {
  quota: { eyebrow: "Votre rythme augmente", title: "Continuez vos analyses sans perdre votre travail.", copy: "Vos résultats restent accessibles. Une formule réactive immédiatement les nouvelles mesures et le suivi dans le temps." },
  brand: { eyebrow: "Nouvelle marque", title: "Ajoutez un nouveau dossier à votre espace.", copy: "Centralisez plusieurs marques, leurs concurrents et leurs historiques sans mélanger les résultats." },
  export: { eyebrow: "Rapport partageable", title: "Transformez ce diagnostic en livrable.", copy: "Débloquez les rapports prêts à présenter et conservez la méthode, les réponses et les sources observées." },
  member: { eyebrow: "Travail en équipe", title: "Invitez votre équipe dans Relief.", copy: "Partagez les dossiers, répartissez les analyses et gardez une facturation centralisée." },
  plan: { eyebrow: "Choisir une formule", title: "Passez de la découverte au suivi régulier.", copy: "Choisissez le volume adapté à votre activité. Aucun dépassement ne sera ajouté sans votre accord." },
} as const;

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ cycle?: string; plan?: string; reason?: string }> }) {
  const params = await searchParams;
  const user = await requireChatGPTUser(`/espace/debloquer?reason=${encodeURIComponent(params.reason ?? "plan")}`);
  const entitlement = await getCommercialEntitlement(user.email);
  const reasonKey = params.reason && params.reason in reasons ? params.reason as keyof typeof reasons : "plan";
  const reason = reasons[reasonKey];
  const recommendedCode = params.plan ?? (reasonKey === "member" ? "agency" : reasonKey === "brand" || reasonKey === "export" ? "consultant" : entitlement?.planCode ?? "solo");
  const plan = getPlan(recommendedCode) ?? RELIEF_PLANS[0];
  const cycle = params.cycle && isBillingCycle(params.cycle) ? params.cycle : "monthly";
  const price = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const ready = isBillingCheckoutReady(plan.code, cycle);

  return <main className="unlock-page"><header className="unlock-header"><Link href="/espace"><Image src="/relief-visibility-os-lockup-on-dark.png" alt="Relief Visibility OS" width={626} height={141} unoptimized /></Link><Link href="/espace">Retour au tableau de bord</Link></header><section className="unlock-shell"><div className="unlock-copy"><span>{reason.eyebrow}</span><h1>{reason.title}</h1><p>{reason.copy}</p><div className="unlock-context"><i>Votre travail est conservé</i><strong>{entitlement?.companyName ?? "Votre espace Relief"}</strong><small>{Math.max(0,(entitlement?.limit ?? 0)-(entitlement?.used ?? 0)).toLocaleString("fr-FR")} mesures encore disponibles</small></div></div><aside className="unlock-offer"><div className="unlock-offer-top"><span>Recommandé pour votre usage</span><Link href="/espace/compte#plan">Comparer les formules</Link></div><h2>{plan.name}</h2><p>{plan.description}</p><div className="unlock-cycle"><Link className={cycle === "monthly" ? "is-active" : ""} href={`/espace/debloquer?reason=${reasonKey}&plan=${plan.code}&cycle=monthly`}>Mensuel</Link><Link className={cycle === "annual" ? "is-active" : ""} href={`/espace/debloquer?reason=${reasonKey}&plan=${plan.code}&cycle=annual`}>Annuel · économisez {Math.round((1-plan.annualTotal/(plan.monthlyPrice*12))*100)} %</Link></div><div className="unlock-price"><strong>{price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €</strong><span>HT / mois{cycle === "annual" ? ` · ${plan.annualTotal.toLocaleString("fr-FR")} € facturés pour 12 mois` : ""}</span></div><ul><li>{plan.measures.toLocaleString("fr-FR")} mesures chaque mois</li><li>{plan.projects} marques ou entreprises</li><li>{plan.historyMonths} mois d’historique</li><li>Aucun dépassement automatique</li></ul>{ready ? <CheckoutButton billingCycle={cycle} planCode={plan.code} /> : <div className="unlock-pending"><button className="button button-hero" disabled>Continuer avec {plan.name}</button><p>Le paiement sera activé ici dès que le compte marchand aura été validé.</p></div>}<small className="unlock-legal">Facture disponible après paiement. Changement ou résiliation accessibles depuis votre compte.</small></aside></section></main>;
}
