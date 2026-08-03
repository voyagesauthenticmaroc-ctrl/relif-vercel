import { CommercialSite } from "./CommercialSite";
import { RELIEF_PLANS, TRIAL_OFFER } from "../lib/plans";
import { siteUrl } from "../lib/site-url";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": siteUrl("/#organization"),
        name: "Relief Visibility OS",
        url: siteUrl("/"),
        logo: {
          "@type": "ImageObject",
          url: siteUrl("/relief-visibility-os-lockup-on-dark.png"),
        },
      },
      {
        "@type": "WebSite",
        "@id": siteUrl("/#website"),
        url: siteUrl("/"),
        name: "Relief Visibility OS",
        inLanguage: "fr-FR",
        publisher: {
          "@id": siteUrl("/#organization"),
        },
      },
      {
        "@type": "WebPage",
        "@id": siteUrl("/#webpage"),
        url: siteUrl("/"),
        name: "Relief Visibility OS — Audit de visibilité dans les réponses IA",
        description:
          "Relief teste les questions des prospects sur ChatGPT, Perplexity et Gemini, conserve les réponses, compare les concurrents et relie chaque priorité aux sources observées.",
        inLanguage: "fr-FR",
        isPartOf: {
          "@id": siteUrl("/#website"),
        },
        about: {
          "@id": siteUrl("/#service"),
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: siteUrl("/og-clarity.png"),
        },
      },
      {
        "@type": "Service",
        "@id": siteUrl("/#service"),
        name: "Audit de visibilité dans les réponses IA Relief",
        serviceType:
          "Audit GEO et mesure de visibilité dans les réponses des assistants IA",
        url: siteUrl("/"),
        provider: {
          "@id": siteUrl("/#organization"),
        },
        description:
          "Un service qui documente les réponses d’assistants IA, compare les marques et les sources citées, puis transforme les écarts observés en priorités à vérifier.",
        offers: [
          {
            "@type": "Offer",
            name: `Essai gratuit de ${TRIAL_OFFER.days} jours`,
            price: 0,
            priceCurrency: "EUR",
            url: siteUrl("/#offres"),
            description: `${TRIAL_OFFER.measures} mesures pour ${TRIAL_OFFER.projects} entreprises, sans carte bancaire.`,
          },
          ...RELIEF_PLANS.map((plan) => ({
            "@type": "Offer",
            name: `Offre mensuelle ${plan.name}`,
            price: plan.monthlyPrice,
            priceCurrency: "EUR",
            url: siteUrl("/#offres"),
            description: plan.description,
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: plan.monthlyPrice,
              priceCurrency: "EUR",
              billingDuration: "P1M",
            },
          })),
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <CommercialSite />
    </>
  );
}
