import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Bienvenue",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="welcome-orbit" />
      <section>
        <Image
          src="/relief-visibility-os-lockup-on-dark.png"
          alt="Relief Visibility OS"
          width={626}
          height={141}
          unoptimized
        />
        <span>Commande reçue</span>
        <h1>Votre accès Relief se prépare.</h1>
        <p>
          La confirmation de paiement est vérifiée séparément. Votre espace
          affichera automatiquement le bon niveau d’accès dès validation.
        </p>
        <a className="button button-hero" href="/espace">
          Ouvrir mon espace <b>→</b>
        </a>
      </section>
    </main>
  );
}
