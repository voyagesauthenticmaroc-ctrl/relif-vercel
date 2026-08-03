import type { Metadata } from "next";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Informations relatives à l’édition, au contact et à l’hébergement du site Relief Visibility OS.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: false, follow: true },
};

export default function LegalNoticesPage() {
  return (
    <LegalPage eyebrow="Informations légales" title="Mentions légales">
      <h2>Éditeur</h2>
      <p>
        Relief Visibility OS est un produit en phase de lancement. Les
        informations définitives de la structure éditrice, son adresse, son
        immatriculation et son représentant légal devront être complétées avant
        l’ouverture commerciale publique.
      </p>
      <h2>Contact</h2>
      <p>
        Une adresse professionnelle vérifiée sera publiée ici avant
        l’ouverture commerciale. Le domaine de contact n’est pas encore
        opérationnel et aucune adresse provisoire n’est présentée comme un
        canal de support actif.
      </p>
      <h2>Hébergement</h2>
      <p>
        Le service est hébergé via ChatGPT Sites. Les conditions définitives
        d’hébergement et les coordonnées applicables seront précisées avant la
        commercialisation.
      </p>
      <aside>
        Cette page constitue une structure de travail et ne remplace pas la
        validation d’un professionnel du droit.
      </aside>
    </LegalPage>
  );
}
