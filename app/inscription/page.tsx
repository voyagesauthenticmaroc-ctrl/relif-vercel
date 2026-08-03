import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPlan, type PlanCode } from "../../lib/plans";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Créer mon espace", robots: { index: false, follow: false } };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const selected = getPlan((await searchParams).plan ?? "");
  const initialPlan = (selected?.code ?? "consultant") as PlanCode;
  return <main className="signup-page"><header><Link href="/" aria-label="Relief Visibility OS"><Image src="/relief-visibility-os-lockup-on-dark.png" alt="Relief Visibility OS" width={626} height={141} priority unoptimized /></Link><Link href="/espace" className="signup-login">J’ai déjà un espace</Link></header><section className="signup-shell"><div className="signup-intro"><span>PREMIER DIAGNOSTIC</span><h1>Découvrez ce que les IA répondent sur votre marque.</h1><p>Créez votre espace, confirmez votre adresse puis préparez les questions que vos prospects posent déjà. Relief organisera le premier audit autour de votre marché.</p><ul><li>Une marque et un diagnostic guidé</li><li>Réponses, concurrents et sources réunis</li><li>Aucune carte demandée à cette étape</li></ul></div><div className="signup-card"><p className="signup-step">Créer votre espace</p><h2>Quelle marque voulez-vous analyser ?</h2><SignupForm initialPlan={initialPlan} /></div></section></main>;
}
