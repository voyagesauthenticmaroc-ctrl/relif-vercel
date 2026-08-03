import type { Metadata } from "next";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: "Conditions de vente",
  description:
    "Conditions applicables aux essais et abonnements Relief Visibility OS.",
  alternates: { canonical: "/cgv" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Conditions commerciales" title="Conditions générales de vente">
      <h2>Offres</h2>
      <p>
        Chaque offre inclut un nombre mensuel de mesures IA et de projets
        indiqué au moment de la commande. Une mesure IA correspond à une
        question testée sur un moteur lors d’un passage indépendant.
      </p>
      <h2>Essai</h2>
      <p>
        L’essai gratuit dure 7 jours, sans carte bancaire, et inclut 60 mesures
        ainsi que 2 projets. À son expiration, les nouvelles mesures sont
        suspendues et aucun abonnement n’est déclenché automatiquement.
      </p>
      <h2>Abonnement et résiliation</h2>
      <p>
        Les offres mensuelles sont renouvelées chaque mois et peuvent être
        résiliées avant la prochaine échéance. Les offres annuelles sont
        facturées en une fois. Aucun dépassement de quota n’est facturé
        automatiquement.
      </p>
      <h2>Nature des résultats</h2>
      <p>
        Relief mesure des réponses produites par des systèmes d’intelligence
        artificielle qui peuvent varier. Le service ne garantit ni une position,
        ni une recommandation, ni un résultat commercial.
      </p>
      <aside>
        Cette structure doit être complétée avec l’identité du vendeur, les
        règles de TVA, la juridiction et les modalités de rétractation
        applicables avant toute vente réelle.
      </aside>
    </LegalPage>
  );
}
