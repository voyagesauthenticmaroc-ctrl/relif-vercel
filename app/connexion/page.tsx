import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };
export default function LoginPage() { return <main className="signup-page"><header><Link href="/"><Image src="/relief-visibility-os-lockup-on-dark.png" alt="Relief Visibility OS" width={626} height={141} priority unoptimized /></Link><Link href="/inscription" className="signup-login">Créer un espace</Link></header><section className="signup-shell"><div className="signup-intro"><span>CONNEXION SÉCURISÉE</span><h1>Retrouvez votre espace Relief.</h1><p>Nous vous envoyons un lien de connexion personnel. Aucun mot de passe à mémoriser, aucun accès partagé.</p></div><div className="signup-card"><p className="signup-step">Connexion</p><h2>Recevez votre lien sécurisé.</h2><LoginForm /></div></section></main>; }
