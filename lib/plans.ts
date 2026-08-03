export type PlanCode = "solo" | "consultant" | "agency";
export type BillingCycle = "annual" | "monthly";

export type ReliefPlan = {
  annualTotal: number;
  annualPrice: number;
  code: PlanCode;
  description: string;
  features: string[];
  historyMonths: number;
  measures: number;
  monthlyPrice: number;
  name: string;
  popular?: boolean;
  projects: number;
  seats: number;
  stripePriceEnv: {
    annual: string;
    monthly: string;
  };
};

export const RELIEF_PLANS: readonly ReliefPlan[] = [
  {
    code: "solo",
    name: "Marque",
    description: "Pour suivre votre entreprise et quelques dossiers.",
    monthlyPrice: 39,
    annualPrice: 32.5,
    annualTotal: 390,
    historyMonths: 6,
    measures: 300,
    projects: 3,
    seats: 1,
    features: [
      "1 compte utilisateur",
      "3 marques ou entreprises suivies",
      "Réponses et sources consultables",
      "Comparaison avec les concurrents",
      "Rapports partageables",
      "Historique sur 6 mois",
      "Priorités reliées aux observations",
    ],
    stripePriceEnv: {
      monthly: "STRIPE_PRICE_SOLO_MONTHLY",
      annual: "STRIPE_PRICE_SOLO_ANNUAL",
    },
  },
  {
    code: "consultant",
    name: "Consultant",
    description: "Pour réaliser plusieurs audits clients chaque mois.",
    monthlyPrice: 109,
    annualPrice: 91,
    annualTotal: 1_090,
    historyMonths: 12,
    measures: 1_500,
    projects: 20,
    seats: 1,
    popular: true,
    features: [
      "1 compte utilisateur",
      "20 marques ou entreprises suivies",
      "Réponses et sources consultables",
      "Rapports prêts à présenter",
      "Comparaison avec les concurrents",
      "Historique sur 12 mois",
      "Priorités reliées aux observations",
    ],
    stripePriceEnv: {
      monthly: "STRIPE_PRICE_CONSULTANT_MONTHLY",
      annual: "STRIPE_PRICE_CONSULTANT_ANNUAL",
    },
  },
  {
    code: "agency",
    name: "Agence",
    description: "Pour standardiser les audits d’un portefeuille clients.",
    monthlyPrice: 289,
    annualPrice: 241,
    annualTotal: 2_890,
    historyMonths: 24,
    measures: 6_000,
    projects: 100,
    seats: 5,
    features: [
      "5 accès utilisateurs inclus",
      "100 marques ou entreprises suivies",
      "Réponses et sources consultables",
      "Rapports prêts à présenter",
      "Dossiers clients séparés",
      "Méthode commune à toute l’équipe",
      "Historique sur 24 mois",
      "Accompagnement prioritaire",
    ],
    stripePriceEnv: {
      monthly: "STRIPE_PRICE_AGENCY_MONTHLY",
      annual: "STRIPE_PRICE_AGENCY_ANNUAL",
    },
  },
] as const;

export const TRIAL_OFFER = {
  days: 7,
  historyMonths: 1,
  measures: 60,
  projects: 2,
  seats: 1,
} as const;

export function getPlan(planCode: string): ReliefPlan | null {
  return RELIEF_PLANS.find((plan) => plan.code === planCode) ?? null;
}

export function isBillingCycle(value: string): value is BillingCycle {
  return value === "annual" || value === "monthly";
}
