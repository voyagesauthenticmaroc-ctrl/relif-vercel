import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./methodologie.module.css";

const title = "Méthodologie d’audit de visibilité IA et GEO";
const description =
  "Comprenez comment Relief teste des questions dans ChatGPT, Perplexity et Gemini, documente chaque passage et interprète les écarts sans promettre de position.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/methodologie",
  },
  openGraph: {
    type: "article",
    url: "/methodologie",
    title: `${title} · Relief Visibility OS`,
    description,
    images: [
      {
        url: "/og.jpg",
        width: 1731,
        height: 909,
        type: "image/jpeg",
        alt: "Relief Visibility OS mesure les marques citées dans les réponses des assistants IA.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.jpg"],
  },
};

const protocolSteps = [
  {
    index: "01",
    title: "Définir l’entreprise sans ambiguïté",
    copy: "Le périmètre réunit le nom de la marque, son site officiel, son activité, sa zone, son public, la langue du test et les concurrents à comparer. Ces éléments servent à relire les réponses dans le bon contexte ; ils ne sont pas injectés comme une conclusion attendue.",
  },
  {
    index: "02",
    title: "Choisir des questions proches d’un vrai besoin",
    copy: "Une série utile couvre plusieurs moments : découvrir une solution, choisir un prestataire, comparer des options ou chercher un acteur local. Relief teste des questions complètes, pas une simple liste de mots-clés.",
  },
  {
    index: "03",
    title: "Exécuter le même protocole sur les assistants retenus",
    copy: "ChatGPT, Perplexity et Gemini reçoivent les questions prévues. Le moteur, la langue, le pays, la formulation et le nombre de passages doivent rester identiques lorsqu’on veut comparer deux campagnes.",
  },
  {
    index: "04",
    title: "Conserver la réponse avant de calculer un indicateur",
    copy: "Chaque résultat reste relié à la question et à la réponse qui le composent. L’indicateur permet de repérer un écart ; la réponse complète permet de le vérifier.",
  },
] as const;

const recordedFields = [
  "La question exacte et son contexte de langue et de pays",
  "L’assistant interrogé, la date et le numéro du passage",
  "La réponse complète produite pendant ce test",
  "La présence ou l’absence de la marque et des concurrents suivis",
  "Les liens, domaines ou sources visibles dans la réponse",
] as const;

const limitations = [
  "Une campagne décrit un échantillon de réponses à un instant donné, pas toutes les conversations possibles.",
  "Une présence observée ne garantit ni une recommandation future ni une position permanente.",
  "Une source visible dans une réponse n’est pas une preuve qu’elle a causé la citation, ni qu’elle appartient aux données d’entraînement du modèle.",
  "Les réponses et leurs sources peuvent contenir des erreurs. Les éléments importants doivent être vérifiés avant toute décision.",
  "Un retest n’est comparable que si la question, les assistants, la langue, le pays et le nombre de passages restent cohérents.",
] as const;

export default function MethodologyPage() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#contenu">
        Aller au contenu
      </a>

      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Relief Visibility OS — accueil">
          <Image
            src="/relief-visibility-os-lockup-on-dark.png"
            alt="Relief Visibility OS"
            width={626}
            height={141}
            priority
            unoptimized
          />
        </Link>
        <nav aria-label="Navigation de la méthodologie">
          <a href="#protocole">Le protocole</a>
          <a href="#interpretation">Interpréter</a>
          <a href="#limites">Les limites</a>
          <Link className={styles.headerCta} href="/#offres">
            Essayer Relief
          </Link>
        </nav>
      </header>

      <main id="contenu">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Méthodologie de mesure</span>
            <h1>
              Comment Relief mesure la visibilité d’une marque dans les réponses
              IA.
            </h1>
            <p>
              Un audit de visibilité IA — parfois appelé audit GEO — observe ce
              que des assistants répondent à des questions proches de celles
              d’un prospect. Relief documente ces réponses pour comparer les
              marques, les concurrents et les sources qui apparaissent.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="/#offres">
                Tester un cas réel
              </Link>
              <Link className={styles.secondaryCta} href="/#demonstration">
                Voir l’audit d’exemple
              </Link>
            </div>
          </div>

          <aside className={styles.definitionCard} aria-label="Définition d’une mesure IA">
            <span>Unité de mesure</span>
            <strong>
              1 question × 1 assistant × 1 passage
            </strong>
            <p>
              Dix questions testées sur trois assistants, avec deux passages,
              représentent 60 mesures.
            </p>
            <div>
              <small>10 questions</small>
              <i>×</i>
              <small>3 assistants</small>
              <i>×</i>
              <small>2 passages</small>
              <b>= 60</b>
            </div>
          </aside>
        </section>

        <section className={styles.definition} aria-labelledby="definition-title">
          <div>
            <span className={styles.sectionLabel}>Définir le sujet</span>
            <h2 id="definition-title">GEO ne veut pas dire « forcer » une recommandation.</h2>
          </div>
          <div className={styles.definitionText}>
            <p>
              GEO signifie généralement <i>Generative Engine Optimization</i> :
              le travail qui aide les moteurs de réponse génératifs à comprendre
              une entité, ses services et les preuves qui les décrivent.
            </p>
            <p>
              Relief intervient au stade de la mesure. Il ne modifie pas les
              assistants et ne connaît pas leur raisonnement interne. Il montre
              ce qui a été répondu pendant un protocole défini, puis aide à
              formuler des hypothèses de travail vérifiables.
            </p>
          </div>
        </section>

        <section className={styles.protocol} id="protocole" aria-labelledby="protocol-title">
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Le protocole</span>
            <h2 id="protocol-title">Quatre étapes avant toute conclusion.</h2>
            <p>
              La valeur d’un audit dépend moins d’un score isolé que de la
              possibilité de retrouver la question, la réponse et les conditions
              dans lesquelles elle a été obtenue.
            </p>
          </div>

          <ol className={styles.protocolGrid}>
            {protocolSteps.map((step) => (
              <li key={step.index}>
                <span>{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.passages} aria-labelledby="passages-title">
          <div className={styles.passagesCopy}>
            <span className={styles.sectionLabel}>Pourquoi répéter</span>
            <h2 id="passages-title">
              Un passage donne une observation. Plusieurs passages renseignent
              sa stabilité.
            </h2>
            <p>
              Deux demandes identiques peuvent produire des formulations ou des
              sélections différentes. Un passage unique est utile pour explorer.
              Des passages répétés montrent si une présence revient dans le
              cadre testé.
            </p>
          </div>
          <div className={styles.stabilityExample}>
            <div>
              <span>Passage 1</span>
              <strong>Marque citée</strong>
            </div>
            <div>
              <span>Passage 2</span>
              <strong>Marque citée</strong>
            </div>
            <div>
              <span>Passage 3</span>
              <strong>Marque absente</strong>
            </div>
            <p>
              Lecture : présence observée dans <b>2 passages sur 3</b>. Ce ratio
              décrit cette série, pas une probabilité universelle.
            </p>
          </div>
        </section>

        <section className={styles.records} aria-labelledby="records-title">
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>La preuve conservée</span>
            <h2 id="records-title">Ce qui accompagne chaque résultat.</h2>
          </div>
          <ul>
            {recordedFields.map((field) => (
              <li key={field}>
                <span aria-hidden="true">✓</span>
                {field}
              </li>
            ))}
          </ul>
          <aside>
            <strong>À propos des sources</strong>
            <p>
              Relief relève les sources visibles dans la réponse. Il ne les
              présente pas comme les données d’entraînement du modèle ni comme
              la cause certaine d’une citation.
            </p>
          </aside>
        </section>

        <section
          className={styles.interpretation}
          id="interpretation"
          aria-labelledby="interpretation-title"
        >
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Interpréter sans surpromettre</span>
            <h2 id="interpretation-title">
              L’indicateur signale où regarder. La réponse explique ce qui a été
              observé.
            </h2>
          </div>

          <div className={styles.interpretationGrid}>
            <article>
              <span>Présence</span>
              <h3>Dans combien de passages la marque apparaît-elle ?</h3>
              <p>
                Le numérateur compte les passages où la marque est identifiée ;
                le dénominateur correspond aux passages terminés du périmètre
                choisi.
              </p>
            </article>
            <article>
              <span>Comparaison</span>
              <h3>Quels concurrents reviennent sur les mêmes questions ?</h3>
              <p>
                La comparaison n’est utile que sur une base commune : mêmes
                questions, assistants, langue, pays et période de mesure.
              </p>
            </article>
            <article>
              <span>Sources visibles</span>
              <h3>Quels domaines ou éléments de preuve sont mentionnés ?</h3>
              <p>
                Ils donnent des pistes à examiner manuellement : clarté de
                l’offre, précision locale, preuves, pages de comparaison ou
                informations manquantes.
              </p>
            </article>
            <article>
              <span>Retest</span>
              <h3>Que se passe-t-il après une modification vérifiable ?</h3>
              <p>
                Relancer le même protocole permet de comparer deux observations.
                Cela ne prouve pas à lui seul que la modification a causé le
                changement.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.limits} id="limites" aria-labelledby="limits-title">
          <div>
            <span className={styles.sectionLabel}>Limites de lecture</span>
            <h2 id="limits-title">Ce qu’un audit Relief ne permet pas d’affirmer.</h2>
            <p>
              Ces limites font partie du rapport : elles évitent de transformer
              une observation ponctuelle en promesse commerciale.
            </p>
          </div>
          <ul>
            {limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>

        <section className={styles.outcome} aria-labelledby="outcome-title">
          <span className={styles.sectionLabel}>À la fin de l’audit</span>
          <h2 id="outcome-title">
            Vous obtenez des réponses consultables, une comparaison et des pistes
            à vérifier.
          </h2>
          <p>
            Le rapport réunit le protocole, les observations et les limites. Vous
            pouvez alors prioriser un chantier de contenu ou de preuve, puis
            relancer les mêmes questions pour comparer.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryCta} href="/#offres">
              Voir l’essai de 7 jours
            </Link>
            <Link className={styles.secondaryCta} href="/#faq">
              Consulter les questions fréquentes
            </Link>
          </div>
          <small>60 mesures · 2 entreprises · aucune carte bancaire</small>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© 2026 Relief Visibility OS</span>
        <div>
          <Link href="/">Accueil</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/cgv">Conditions de vente</Link>
        </div>
      </footer>
    </div>
  );
}
