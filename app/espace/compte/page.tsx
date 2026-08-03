import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  findTrialByEmail,
  getCommercialEntitlement,
  getOnboardingByEmail,
  listWorkspaceMembers,
} from "../../../db/commercial";
import {
  isBillingCheckoutReady,
  isStripeApiReady,
} from "../../../lib/billing-readiness";
import { RELIEF_PLANS, getPlan } from "../../../lib/plans";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { AccountNavigation } from "../AccountNavigation";
import { BillingPortalButton, CheckoutButton } from "../CheckoutButton";
import { InviteMemberForm } from "./InviteMemberForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Compte et facturation",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireChatGPTUser("/espace/compte");
  const [trial, entitlement, onboarding] = await Promise.all([
    findTrialByEmail(user.email),
    getCommercialEntitlement(user.email),
    getOnboardingByEmail(user.email),
  ]);
  const members = entitlement?.workspaceId
    ? await listWorkspaceMembers(entitlement.workspaceId)
    : [];
  const currentPlan =
    getPlan(entitlement?.planCode ?? trial?.plan_code ?? "consultant") ??
    RELIEF_PLANS[1];
  const used = entitlement?.used ?? 0;
  const limit = entitlement?.limit ?? 0;
  const percentage = limit
    ? Math.min(100, Math.round((used / limit) * 100))
    : 0;
  const hasSubscription = Boolean(entitlement?.stripeSubscriptionId);
  const isActive = Boolean(
    entitlement?.billingStatus &&
      ["active", "trialing"].includes(entitlement.billingStatus),
  );
  const paymentIssue = Boolean(
    entitlement?.billingStatus &&
      ["past_due", "unpaid"].includes(entitlement.billingStatus),
  );
  const seatLimit = entitlement?.limits.seats ?? 1;

  return (
    <main className="account-page">
      <header className="account-header">
        <Link href="/">
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
          <form action="/api/auth/signout" method="post">
            <button type="submit">Se déconnecter</button>
          </form>
        </div>
      </header>
      <section className="account-shell">
        <AccountNavigation active="account" />
        <div className="account-hero compact">
          <span className="section-index">Compte et facturation</span>
          <h1>Gardez la maîtrise de votre accès.</h1>
          <p>
            Votre formule, vos limites, votre équipe et vos factures sont réunies
            au même endroit.
          </p>
        </div>

        <div className="account-settings-grid">
          <aside className="settings-index">
            <a href="#overview">Vue d’ensemble</a>
            <a href="#workspace">Espace et membres</a>
            <a href="#plan">Plan et usage</a>
            <a href="#billing">Factures et paiement</a>
            <a href="#security">Sécurité</a>
          </aside>
          <div className="settings-content">
            <section id="overview" className="settings-card">
              <div className="settings-heading">
                <span>Vue d’ensemble</span>
                <h2>
                  {paymentIssue
                    ? "Paiement à régulariser"
                    : isActive
                      ? `Formule ${currentPlan.name}`
                      : "Accès Découverte"}
                </h2>
                <p>
                  {paymentIssue
                    ? "Vos résultats restent consultables. Mettez à jour votre moyen de paiement pour relancer les analyses."
                    : isActive
                      ? "Votre abonnement est actif et piloté depuis cet espace."
                      : "Votre espace reste sans carte tant que vous ne choisissez pas une formule."}
                </p>
              </div>
              <div className="settings-kpis">
                <div>
                  <small>Mesures utilisées</small>
                  <strong>{used.toLocaleString("fr-FR")}</strong>
                  <span>sur {limit.toLocaleString("fr-FR") || "—"}</span>
                </div>
                <div>
                  <small>Marques disponibles</small>
                  <strong>{entitlement?.limits.projects ?? 1}</strong>
                  <span>selon votre accès</span>
                </div>
                <div>
                  <small>Membres</small>
                  <strong>
                    {members.length}/{seatLimit}
                  </strong>
                  <span>accès utilisés</span>
                </div>
              </div>
              <div
                className="settings-meter"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${percentage}%` }} />
              </div>
            </section>

            <section id="workspace" className="settings-card">
              <div className="settings-heading">
                <span>Espace et membres</span>
                <h2>{trial?.company_name ?? entitlement?.companyName ?? "Votre espace Relief"}</h2>
              </div>
              <dl className="settings-list">
                <div>
                  <dt>Domaine observé</dt>
                  <dd>{onboarding?.domain ?? "À renseigner dans l’onboarding"}</dd>
                </div>
                <div>
                  <dt>Marché et secteur</dt>
                  <dd>
                    {onboarding
                      ? `${onboarding.country} · ${onboarding.sector}`
                      : "À configurer"}
                  </dd>
                </div>
              </dl>
              <div className="team-list">
                {members.map((member) => (
                  <div key={`${member.email}-${member.status}`}>
                    <span>{member.display_name.slice(0, 1).toUpperCase()}</span>
                    <p>
                      <strong>{member.display_name}</strong>
                      <small>{member.email}</small>
                    </p>
                    <b>{member.status === "pending" ? "Invitation envoyée" : member.role}</b>
                  </div>
                ))}
              </div>
              {seatLimit > 1 ? (
                <InviteMemberForm disabled={members.length >= seatLimit} />
              ) : (
                <div className="team-upgrade">
                  <p>Les invitations d’équipe sont incluses dans la formule Agence.</p>
                  <Link href="/espace/debloquer?reason=member&plan=agency">
                    Voir la formule Agence
                  </Link>
                </div>
              )}
            </section>

            <section id="plan" className="settings-card">
              <div className="settings-heading">
                <span>Plan et usage</span>
                <h2>Choisissez le rythme adapté à votre activité.</h2>
                <p>
                  Aucun dépassement n’est facturé automatiquement. Lorsque la
                  limite est atteinte, les nouvelles analyses sont mises en pause.
                </p>
              </div>
              <div className="account-plan-grid">
                {RELIEF_PLANS.map((plan) => (
                  <article
                    className={plan.code === currentPlan.code ? "is-current" : ""}
                    key={plan.code}
                  >
                    <small>
                      {plan.code === currentPlan.code
                        ? "Votre choix actuel"
                        : plan.description}
                    </small>
                    <h3>{plan.name}</h3>
                    <strong>
                      {plan.monthlyPrice} € <i>HT / mois</i>
                    </strong>
                    <ul>
                      <li>
                        {plan.projects} marque{plan.projects > 1 ? "s" : ""}
                      </li>
                      <li>{plan.measures.toLocaleString("fr-FR")} mesures / mois</li>
                      <li>
                        {plan.seats} accès utilisateur{plan.seats > 1 ? "s" : ""}
                      </li>
                    </ul>
                    {hasSubscription ? (
                      plan.code === currentPlan.code ? (
                        <span className="plan-current-label">
                          {paymentIssue ? "À régulariser" : "Formule active"}
                        </span>
                      ) : (
                        <BillingPortalButton />
                      )
                    ) : isBillingCheckoutReady(plan.code, "monthly") ? (
                      <CheckoutButton
                        billingCycle="monthly"
                        planCode={plan.code}
                      />
                    ) : (
                      <Link
                        className="button button-outline"
                        href={`/espace/debloquer?reason=plan&plan=${plan.code}`}
                      >
                        Découvrir {plan.name}
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section id="billing" className="settings-card">
              <div className="settings-heading">
                <span>Factures et paiement</span>
                <h2>
                  {hasSubscription
                    ? "Votre facturation est gérée de manière sécurisée."
                    : "Aucun moyen de paiement enregistré."}
                </h2>
                <p>
                  {hasSubscription
                    ? "Consultez vos factures, votre carte, vos coordonnées de facturation et votre abonnement dans le portail sécurisé."
                    : "Vous ne serez jamais débité sans avoir confirmé une formule et son échéance."}
                </p>
              </div>
              {hasSubscription && isStripeApiReady() ? (
                <BillingPortalButton />
              ) : (
                <div className="billing-reassurance">
                  <span>✓ Aucun prélèvement automatique en Découverte</span>
                  <span>✓ Factures téléchargeables après souscription</span>
                  <span>✓ Résiliation accessible depuis le compte</span>
                </div>
              )}
            </section>

            <section id="security" className="settings-card">
              <div className="settings-heading">
                <span>Sécurité</span>
                <h2>Connexion sans mot de passe.</h2>
                <p>
                  Relief envoie un lien personnel à {user.email}. Les liens sont
                  temporaires, à usage unique, et chaque session peut être révoquée
                  côté serveur.
                </p>
              </div>
              <div className="security-actions">
                <Link className="button button-outline" href="/connexion">
                  Recevoir un nouveau lien
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button className="button button-outline" type="submit">
                    Fermer cette session
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
