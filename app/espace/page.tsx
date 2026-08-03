import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  findTrialByEmail,
  getCommercialEntitlement,
  getOnboardingByEmail,
} from "../../db/commercial";
import {
  isBillingCheckoutReady,
  isStripeApiReady,
} from "../../lib/billing-readiness";
import {
  RELIEF_PLANS,
  getPlan,
  isBillingCycle,
} from "../../lib/plans";
import {
  requireChatGPTUser,
} from "../chatgpt-auth";
import {
  BillingPortalButton,
  CheckoutButton,
} from "./CheckoutButton";
import { OnboardingWizard } from "./OnboardingWizard";
import { AccountNavigation } from "./AccountNavigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: { index: false, follow: false },
};

type SpacePageProps = {
  searchParams: Promise<{
    checkout?: string;
    cycle?: string;
    onboarding?: string;
    plan?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return null;
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(date);
}

function statusCopy(status: string, cancelAtPeriodEnd: boolean) {
  if (status === "active" && cancelAtPeriodEnd) {
    return {
      label: "Résiliation programmée",
      message:
        "Votre accès reste ouvert jusqu’à la fin de la période déjà réglée.",
    };
  }
  if (status === "active") {
    return {
      label: "Abonnement actif",
      message: "Votre formule est active et vos mesures sont disponibles.",
    };
  }
  if (status === "trialing") {
    return {
      label: "Accès Découverte",
      message:
        "Votre premier espace est actif. Lancez un diagnostic, puis choisissez votre rythme quand vous aurez besoin d’aller plus loin.",
    };
  }
  if (status === "past_due") {
    return {
      label: "Paiement à régulariser",
      message:
        "Les nouvelles mesures sont suspendues. Mettez à jour votre moyen de paiement pour les réactiver.",
    };
  }
  if (status === "unpaid") {
    return {
      label: "Paiement à régulariser",
      message:
        "Les nouvelles mesures sont suspendues. Votre facturation peut être régularisée depuis Stripe.",
    };
  }
  if (status === "paused") {
    return {
      label: "Abonnement suspendu",
      message:
        "Les nouvelles mesures sont suspendues tant que l’abonnement reste en pause.",
    };
  }
  if (status === "incomplete" || status === "inactive") {
    return {
      label: "Activation à terminer",
      message:
        "Aucun accès payant n’a été accordé. Reprenez la facturation depuis votre espace Stripe.",
    };
  }
  if (status === "canceled" || status === "incomplete_expired") {
    return {
      label: "Abonnement terminé",
      message:
        "Vos anciens résultats restent consultables. Une formule réactive les mesures.",
    };
  }
  return {
    label: "Compte créé",
    message: "Choisissez une formule pour lancer de nouvelles mesures.",
  };
}

function readStringList(value: string | undefined) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, 3) : [];
  } catch { return []; }
}

export default async function SpacePage({ searchParams }: SpacePageProps) {
  const params = await searchParams;
  const returnParams = new URLSearchParams();
  const returnPlan = getPlan(params.plan ?? "");
  if (returnPlan) returnParams.set("plan", returnPlan.code);
  const requestedBillingCycle =
    params.cycle && isBillingCycle(params.cycle)
      ? params.cycle
      : "monthly";
  if (params.cycle && isBillingCycle(params.cycle)) {
    returnParams.set("cycle", requestedBillingCycle);
  }
  const user = await requireChatGPTUser(
    returnParams.size ? `/espace?${returnParams.toString()}` : "/espace",
  );
  const [trial, entitlement, onboarding] = await Promise.all([
    findTrialByEmail(user.email),
    getCommercialEntitlement(user.email),
    getOnboardingByEmail(user.email),
  ]);
  const onboardingQuestions = readStringList(onboarding?.questions_json);
  const hasManagedSubscription = Boolean(
    entitlement?.stripeCustomerId &&
      entitlement.stripeSubscriptionId &&
      entitlement.billingStatus &&
      entitlement.billingStatus !== "canceled" &&
      entitlement.billingStatus !== "incomplete_expired",
  );
  const billingCycle =
    hasManagedSubscription && entitlement?.billingCycle
      ? entitlement.billingCycle
      : requestedBillingCycle;
  const requestedPlan =
    getPlan(
      hasManagedSubscription
        ? entitlement?.planCode ?? ""
        : params.plan ?? entitlement?.planCode ?? "",
    ) ?? RELIEF_PLANS[0];
  const checkoutReady = isBillingCheckoutReady(
    requestedPlan.code,
    billingCycle,
  );
  const billingPortalReady = isStripeApiReady();
  const reliefAppUrl = process.env.NEXT_PUBLIC_RELIEF_APP_URL?.trim() || null;
  const remainingMeasures = Math.max(
    0,
    (entitlement?.limit ?? 0) - (entitlement?.used ?? 0),
  );
  const usagePercentage = entitlement?.limit
    ? Math.min(100, Math.round((entitlement.used / entitlement.limit) * 100))
    : 0;
  const status = statusCopy(
    entitlement?.status ?? trial?.status ?? "inactive",
    entitlement?.cancelAtPeriodEnd ?? false,
  );
  const periodEnd =
    entitlement?.currentPeriodEnd ?? entitlement?.trialEndsAt ?? null;
  const formattedPeriodEnd = formatDate(periodEnd);
  const displayName =
    trial?.full_name ?? user.fullName ?? user.displayName.split("@")[0];

  if (trial?.status === "requested") {
    return (
      <main className="account-page">
        <header className="account-header">
          <Link href="/" aria-label="Retour à l’accueil">
            <Image
              src="/relief-visibility-os-lockup.png"
              alt="Relief Visibility OS"
              width={994}
              height={369}
              priority
              unoptimized
            />
          </Link>
          <div>
            <span>{user.displayName}</span>
            <form action="/api/auth/signout" method="post"><button type="submit">Se déconnecter</button></form>
          </div>
        </header>
        <section className="account-shell">
          <AccountNavigation active="dashboard" />
          <div className="account-hero">
            <span className="section-index">Activation sécurisée</span>
            <h1>Bonjour {displayName}.</h1>
            <p>
              Votre demande a bien été retrouvée. Confirmez le dossier à
              auditer avant l’activation de votre accès Découverte.
            </p>
          </div>
          <OnboardingWizard defaultCompanyName={trial.company_name} />
        </section>
      </main>
    );
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <Link href="/" aria-label="Retour à l’accueil">
          <Image
            src="/relief-visibility-os-lockup.png"
            alt="Relief Visibility OS"
            width={994}
            height={369}
            priority
            unoptimized
          />
        </Link>
        <div>
          <span>{user.displayName}</span>
          <form action="/api/auth/signout" method="post"><button type="submit">Se déconnecter</button></form>
        </div>
      </header>

      <section className="account-shell">
        <AccountNavigation active="dashboard" />
        <div className="account-hero">
          <span className="section-index">Votre espace</span>
          <h1>Bonjour {displayName}.</h1>
          <p>{status.message}</p>
        </div>

        {params.checkout === "success" && (
          <div className="account-empty" role="status">
            <span>Retour de Stripe</span>
            <strong>
              {hasManagedSubscription
                ? "Votre abonnement est actif."
                : "Nous attendons la confirmation signée du paiement."}
            </strong>
            {!hasManagedSubscription && (
              <p>
                Cela prend généralement quelques secondes. Rechargez la page
                pour afficher le statut confirmé ; votre accès ne dépend jamais
                du simple lien de retour.
              </p>
            )}
          </div>
        )}
        {params.onboarding === "complete" && (
          <div className="account-empty account-success" role="status">
            <span>Configuration terminée</span>
            <strong>Votre premier diagnostic est préparé.</strong>
            <p>Relief a enregistré votre marque, votre marché et les premières questions à observer.</p>
          </div>
        )}
        {params.checkout === "cancelled" && (
          <div className="account-empty" role="status">
            <span>Paiement interrompu</span>
            <strong>Rien n’a été débité.</strong>
            <p>
              Votre accès Découverte et vos données n’ont pas été modifiés. Vous pourrez
              reprendre la souscription quand vous le souhaitez.
            </p>
          </div>
        )}

        {trial || entitlement ? (
          <div className="account-grid">
            <article className="account-status">
              <div className="status-topline">
                <span>
                  <i />
                  {status.label}
                </span>
                <small>Formule {requestedPlan.name}</small>
              </div>
              <strong>{remainingMeasures.toLocaleString("fr-FR")}</strong>
              <p>mesures disponibles sur la période</p>
              <div
                className="usage-line"
                role="progressbar"
                aria-label="Quota de mesures utilisé"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={usagePercentage}
                aria-valuetext={`${usagePercentage} % du quota utilisé`}
              >
                <i style={{ width: `${usagePercentage}%` }} />
              </div>
              <div className="status-details">
                <span>
                  <small>Entreprise</small>
                  <b>
                    {trial?.company_name ??
                      entitlement?.companyName ??
                      "Votre espace Relief"}
                  </b>
                </span>
                <span>
                  <small>
                    {entitlement?.status === "active"
                      ? entitlement.cancelAtPeriodEnd
                        ? "Accès jusqu’au"
                        : "Prochaine échéance"
                      : entitlement?.billingStatus === "past_due" ||
                          entitlement?.billingStatus === "unpaid"
                        ? "Facturation"
                      : "Accès Découverte"}
                  </small>
                  <b>
                    {entitlement?.billingStatus === "past_due" ||
                    entitlement?.billingStatus === "unpaid"
                      ? "Moyen de paiement à mettre à jour"
                      : formattedPeriodEnd ?? "Date en cours de confirmation"}
                  </b>
                </span>
              </div>
              {reliefAppUrl && entitlement ? (
                <a className="button button-hero" href={reliefAppUrl}>
                  {entitlement.readOnly
                    ? "Consulter mes résultats"
                    : "Ouvrir Relief"}{" "}
                  <b aria-hidden="true">→</b>
                </a>
              ) : entitlement?.access ? (
                <Link className="button button-hero" href="/espace/diagnostic">Voir mon diagnostic préparé <b aria-hidden="true">→</b></Link>
              ) : (
                <Link className="button button-hero" href="/espace/debloquer?reason=quota">Réactiver les analyses <b aria-hidden="true">→</b></Link>
              )}
            </article>

            <article className="account-next">
              <span className="card-kicker">
                {entitlement?.access ? "Pour commencer" : "Vos données"}
              </span>
              {entitlement?.access ? (
                <>
                  <h2>{onboarding ? "Vos premières questions sont prêtes." : "Votre première mesure prend quelques minutes."}</h2>
                  <ol>{onboardingQuestions.length ? onboardingQuestions.map((question,index) => <li key={question}><span>{index + 1}</span>{question}</li>) : <><li><span>1</span>Ajoutez l’entreprise et son site officiel</li><li><span>2</span>Indiquez sa zone, son activité et ses rivaux</li><li><span>3</span>Lancez les questions qui comptent vraiment</li></>}</ol>
                  <p>
                    Le quota ne baisse qu’au lancement d’une mesure. Consulter
                    un résultat existant ne consomme rien.
                  </p>
                </>
              ) : (
                <>
                  <h2>Vos résultats restent à vous.</h2>
                  <p>
                    Vous pouvez consulter l’historique déjà produit. La
                    souscription réactive simplement les nouvelles mesures.
                  </p>
                </>
              )}
            </article>
          </div>
        ) : (
          <div className="account-empty">
            <span>Adresse connectée</span>
            <strong>{user.email}</strong>
            <p>
              Aucun espace n’est rattaché à cette adresse. Créez votre espace
              Découverte ou choisissez directement une formule ci-dessous.
            </p>
            <Link className="button" href="/#offres">
              Voir les formules
            </Link>
          </div>
        )}

        {entitlement?.access && <section className="account-intents"><div><span className="section-index">Quand votre besoin grandit</span><h2>Débloquez seulement ce dont vous avez besoin.</h2></div><div className="intent-grid"><Link href="/espace/debloquer?reason=brand"><span>Nouvelle marque</span><strong>Ajouter un dossier</strong><b>→</b></Link><Link href="/espace/debloquer?reason=export"><span>Livrable client</span><strong>Exporter un rapport</strong><b>→</b></Link><Link href="/espace/debloquer?reason=brand&plan=agency"><span>Portefeuille clients</span><strong>Passer à l’échelle Agence</strong><b>→</b></Link></div></section>}

        <section className="account-offer">
          <div>
            <span className="section-index">
              {hasManagedSubscription ? "Votre formule" : "Continuer après Découverte"}
            </span>
            <h2>{requestedPlan.name}</h2>
            <p>{requestedPlan.description}</p>
            {!hasManagedSubscription && (
              <p>
                <Link
                  href={`/espace?plan=${requestedPlan.code}&cycle=monthly`}
                >
                  Paiement mensuel
                </Link>
                {" · "}
                <Link
                  href={`/espace?plan=${requestedPlan.code}&cycle=annual`}
                >
                  Paiement annuel
                </Link>
              </p>
            )}
          </div>
          <div className="account-plan-price">
            <strong>
              {(billingCycle === "annual"
                ? requestedPlan.annualPrice
                : requestedPlan.monthlyPrice
              ).toLocaleString("fr-FR", {
                maximumFractionDigits: 2,
                minimumFractionDigits:
                  billingCycle === "annual" &&
                  !Number.isInteger(requestedPlan.annualPrice)
                    ? 2
                    : 0,
              })}{" "}
              €
            </strong>
            <span>
              HT / mois
              {billingCycle === "annual" ? ", réglé une fois par an" : ""}
            </span>
          </div>
          <ul>
            <li>
              {requestedPlan.measures.toLocaleString("fr-FR")} mesures / mois
            </li>
            <li>{requestedPlan.projects} entreprises</li>
            <li>{requestedPlan.features[2]}</li>
          </ul>
          {hasManagedSubscription && billingPortalReady ? (
            <BillingPortalButton />
          ) : !hasManagedSubscription && checkoutReady ? (
            <CheckoutButton
              billingCycle={billingCycle}
              planCode={requestedPlan.code}
            />
          ) : (
            <div className="checkout-action">
              <button className="button button-outline" disabled type="button">
                {hasManagedSubscription
                  ? "Gestion de l’abonnement bientôt disponible"
                  : "Paiement en ligne bientôt disponible"}
              </button>
              <p role="status">
                {hasManagedSubscription
                  ? "Votre accès actuel reste inchangé. Le portail sera affiché ici dès que la facturation sera activée."
                  : "Votre accès Découverte reste ouvert. Aucun paiement ne peut être lancé tant que la facturation n’est pas configurée."}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
