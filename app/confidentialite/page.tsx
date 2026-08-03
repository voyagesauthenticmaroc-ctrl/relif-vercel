import type { Metadata } from "next";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Informations sur les données traitées lors d’un essai ou d’un abonnement à Relief Visibility OS.",
  alternates: { canonical: "/confidentialite" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Protection des données" title="Politique de confidentialité">
      <h2>Données collectées</h2>
      <p>
        Lors d’une demande d’essai, Relief collecte le nom, l’adresse e-mail
        professionnelle, l’entreprise, le profil d’usage et le volume estimé.
        Les données de paiement sont traitées par Stripe et ne sont pas stockées
        par Relief.
      </p>
      <h2>Finalités</h2>
      <p>
        Ces informations servent uniquement à créer l’accès, gérer l’essai,
        administrer l’abonnement, mesurer les quotas et assurer le support.
        Aucun suivi publicitaire n’est installé dans cette première version.
      </p>
      <p>
        Un identifiant technique pseudonymisé par HMAC peut être utilisé afin
        de limiter les demandes automatisées. L’adresse réseau brute n’est pas
        conservée dans cette table de protection ni rattachée au compte.
      </p>
      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées pendant la durée nécessaire à l’essai, à la
        gestion du compte et aux obligations légales applicables. Vous pouvez
        demander leur suppression anticipée à tout moment.
      </p>
      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l’accès, la rectification ou la suppression de vos
        données. Le canal de contact professionnel permettant d’exercer ces
        droits sera affiché sur cette page avant l’ouverture commerciale.
      </p>
      <aside>
        Le calendrier détaillé de suppression, les sous-traitants et les
        coordonnées du responsable de traitement devront être validés avant
        l’ouverture commerciale.
      </aside>
    </LegalPage>
  );
}
