import {
  getPlan,
  type BillingCycle,
  type PlanCode,
} from "./plans";

function configured(name: string, prefix: string) {
  return process.env[name]?.trim().startsWith(prefix) ?? false;
}

export function isStripeApiReady() {
  return configured("STRIPE_SECRET_KEY", "sk_");
}

export function isBillingCheckoutReady(
  planCode: PlanCode,
  billingCycle: BillingCycle,
) {
  const plan = getPlan(planCode);
  if (!plan) return false;

  return (
    isStripeApiReady() &&
    configured("STRIPE_WEBHOOK_SECRET", "whsec_") &&
    configured(plan.stripePriceEnv[billingCycle], "price_")
  );
}
