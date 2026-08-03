import {
  selectDistinctQuestionCandidates,
  validateQuestionForCompany,
  type QuestionCompanyContext,
} from "./question-quality.ts";

export type { QuestionCompanyContext } from "./question-quality.ts";

export type QuestionCandidate = {
  text: string;
  intent: string;
  reason: string;
  value: number;
};

type CompanyContext = QuestionCompanyContext;

type Situation = {
  need: string;
  budget: string;
};

type ActivityProfile = {
  keywords: string[];
  journey?: "restaurant" | "accommodation" | "appointment" | "healthcare";
  questionLabel: string;
  articleLabel: string;
  pluralLabel: string;
  pluralQuestionWord?: "Quels" | "Quelles";
  pluralAgreement?: "notÃ©s" | "notÃ©es";
  service: string;
  expertise: string;
  localityScope: "hyperlocal" | "catchment";
  situations: [Situation, Situation, Situation, Situation];
  differentiators: [string, string, string];
  audiences: [string, string];
};

const profiles: ActivityProfile[] = [
  {
    keywords: [
      "decoration",
      "decorateur",
      "amenagement interieur",
      "architecture interieur",
      "home staging",
    ],
    questionLabel: "Quel dÃ©corateur dâ€™intÃ©rieur",
    articleLabel: "un dÃ©corateur dâ€™intÃ©rieur",
    pluralLabel: "dÃ©corateurs dâ€™intÃ©rieur",
    service: "un projet dâ€™amÃ©nagement intÃ©rieur",
    expertise: "lâ€™amÃ©nagement et la dÃ©coration intÃ©rieure",
    localityScope: "catchment",
    situations: [
      {
        need: "amÃ©nager un salon",
        budget: "lâ€™amÃ©nagement complet dâ€™un salon",
      },
      {
        need: "rÃ©nover une piÃ¨ce de vie",
        budget: "la rÃ©novation dÃ©corative dâ€™une piÃ¨ce de vie",
      },
      {
        need: "optimiser un petit espace",
        budget: "lâ€™optimisation dâ€™un petit appartement",
      },
      {
        need: "prÃ©parer un logement Ã  la vente",
        budget: "une prestation de home staging",
      },
    ],
    differentiators: [
      "un accompagnement Ã©coresponsable",
      "des plans et projections 3D",
      "un suivi complet du projet",
    ],
    audiences: ["une maison ancienne", "un investissement locatif"],
  },
  {
    keywords: [
      "restaurant",
      "restauration",
      "brasserie",
      "bistrot",
      "pizzeria",
      "creperie",
      "sushi",
      "cafe",
    ],
    journey: "restaurant",
    questionLabel: "Quel restaurant",
    articleLabel: "un restaurant",
    pluralLabel: "restaurants",
    service: "un dÃ©jeuner ou un dÃ®ner",
    expertise: "la cuisine et lâ€™accueil de groupes",
    localityScope: "hyperlocal",
    situations: [
      {
        need: "organiser un repas de groupe",
        budget: "un repas de groupe",
      },
      {
        need: "trouver une option vÃ©gÃ©tarienne",
        budget: "un menu vÃ©gÃ©tarien complet",
      },
      {
        need: "dÃ®ner en famille",
        budget: "un dÃ®ner en famille",
      },
      {
        need: "rÃ©server pour une occasion spÃ©ciale",
        budget: "un repas pour une occasion spÃ©ciale",
      },
    ],
    differentiators: [
      "des produits locaux et de saison",
      "une terrasse",
      "des options pour les allergies alimentaires",
    ],
    audiences: ["un repas avec des enfants", "un Ã©vÃ©nement professionnel"],
  },
  {
    keywords: ["traiteur"],
    questionLabel: "Quel traiteur",
    articleLabel: "un traiteur",
    pluralLabel: "traiteurs",
    service: "un repas ou un Ã©vÃ©nement",
    expertise: "les repas, buffets et rÃ©ceptions",
    localityScope: "hyperlocal",
    situations: [
      {
        need: "organiser un buffet",
        budget: "un buffet",
      },
      {
        need: "prÃ©parer un repas de mariage",
        budget: "un repas de mariage",
      },
      {
        need: "organiser un dÃ©jeuner dâ€™entreprise",
        budget: "un dÃ©jeuner dâ€™entreprise",
      },
      {
        need: "prÃ©voir des options vÃ©gÃ©tariennes",
        budget: "un menu avec des options vÃ©gÃ©tariennes",
      },
    ],
    differentiators: [
      "une dÃ©gustation avant lâ€™Ã©vÃ©nement",
      "des produits locaux et de saison",
      "la livraison et le service sur place",
    ],
    audiences: ["un mariage", "un Ã©vÃ©nement dâ€™entreprise"],
  },
  {
    keywords: ["plombier", "plomberie", "chauffagiste", "sanitaire"],
    questionLabel: "Quel plombier",
    articleLabel: "un plombier",
    pluralLabel: "plombiers",
    service: "une intervention de plomberie",
    expertise: "les dÃ©pannages et installations de plomberie",
    localityScope: "catchment",
    situations: [
      {
        need: "rÃ©parer une fuite dâ€™eau",
        budget: "la rÃ©paration dâ€™une fuite dâ€™eau",
      },
      {
        need: "remplacer un chauffe-eau",
        budget: "le remplacement dâ€™un chauffe-eau",
      },
      {
        need: "dÃ©boucher une canalisation",
        budget: "le dÃ©bouchage dâ€™une canalisation",
      },
      {
        need: "rÃ©nover une salle de bain",
        budget: "la plomberie dâ€™une rÃ©novation de salle de bain",
      },
    ],
    differentiators: [
      "un dÃ©pannage le jour mÃªme",
      "un devis clair avant intervention",
      "une garantie sur les travaux",
    ],
    audiences: ["une maison ancienne", "une copropriÃ©tÃ©"],
  },
  {
    keywords: [
      "entreprise de nettoyage",
      "societe de nettoyage",
      "nettoyage",
      "proprete",
    ],
    questionLabel: "Quelle entreprise de nettoyage",
    articleLabel: "une entreprise de nettoyage",
    pluralLabel: "entreprises de nettoyage",
    pluralQuestionWord: "Quelles",
    pluralAgreement: "notÃ©es",
    service: "une prestation de nettoyage",
    expertise: "les prestations de nettoyage",
    localityScope: "catchment",
    situations: [
      {
        need: "nettoyer des bureaux",
        budget: "le nettoyage de bureaux",
      },
      {
        need: "nettoyer des vitres",
        budget: "le nettoyage de vitres",
      },
      {
        need: "rÃ©aliser un nettoyage de fin de chantier",
        budget: "un nettoyage de fin de chantier",
      },
      {
        need: "entretenir les parties communes dâ€™un immeuble",
        budget: "lâ€™entretien des parties communes dâ€™un immeuble",
      },
    ],
    differentiators: [
      "des produits respectueux de lâ€™environnement",
      "des horaires dâ€™intervention flexibles",
      "un contrÃ´le qualitÃ© documentÃ©",
    ],
    audiences: ["des particuliers", "des entreprises"],
  },
  {
    keywords: ["electricien", "electricite", "domotique"],
    questionLabel: "Quel Ã©lectricien",
    articleLabel: "un Ã©lectricien",
    pluralLabel: "Ã©lectriciens",
    service: "des travaux Ã©lectriques",
    expertise: "lâ€™installation et le dÃ©pannage Ã©lectrique",
    localityScope: "catchment",
    situations: [
      {
        need: "mettre une installation aux normes",
        budget: "une mise aux normes Ã©lectriques",
      },
      {
        need: "rÃ©soudre une panne Ã©lectrique",
        budget: "un dÃ©pannage Ã©lectrique",
      },
      {
        need: "remplacer un tableau Ã©lectrique",
        budget: "le remplacement dâ€™un tableau Ã©lectrique",
      },
      {
        need: "installer une borne de recharge",
        budget: "lâ€™installation dâ€™une borne de recharge",
      },
    ],
    differentiators: [
      "une intervention rapide",
      "une certification reconnue",
      "des solutions de domotique",
    ],
    audiences: ["une maison en rÃ©novation", "des locaux professionnels"],
  },
  {
    keywords: ["immobilier", "agent immobilier", "agence immobiliere"],
    questionLabel: "Quelle agence immobiliÃ¨re",
    articleLabel: "une agence immobiliÃ¨re",
    pluralLabel: "agences immobiliÃ¨res",
    pluralQuestionWord: "Quelles",
    service: "un projet immobilier",
    expertise: "la vente, lâ€™achat et lâ€™estimation immobiliÃ¨re",
    localityScope: "catchment",
    situations: [
      {
        need: "vendre une maison rapidement",
        budget: "les frais de vente dâ€™une maison",
      },
      {
        need: "estimer un appartement",
        budget: "une estimation immobiliÃ¨re",
      },
      {
        need: "acheter un premier logement",
        budget: "lâ€™accompagnement pour un premier achat",
      },
      {
        need: "mettre un bien en location",
        budget: "la gestion locative dâ€™un bien",
      },
    ],
    differentiators: [
      "une estimation offerte",
      "une forte connaissance du marchÃ© local",
      "un accompagnement jusquâ€™Ã  la signature",
    ],
    audiences: ["un premier achat", "un investissement locatif"],
  },
  {
    keywords: ["garage", "automobile", "mecanicien", "carrosserie"],
    questionLabel: "Quel garage",
    articleLabel: "un garage",
    pluralLabel: "garages",
    service: "lâ€™entretien ou la rÃ©paration dâ€™un vÃ©hicule",
    expertise: "lâ€™entretien, le diagnostic et la rÃ©paration automobile",
    localityScope: "catchment",
    situations: [
      {
        need: "faire rÃ©viser une voiture",
        budget: "une rÃ©vision automobile",
      },
      {
        need: "remplacer un embrayage",
        budget: "le remplacement dâ€™un embrayage",
      },
      {
        need: "rÃ©parer une panne rapidement",
        budget: "un diagnostic et une rÃ©paration automobile",
      },
      {
        need: "remettre une carrosserie en Ã©tat",
        budget: "une rÃ©paration de carrosserie",
      },
    ],
    differentiators: [
      "un vÃ©hicule de prÃªt",
      "un diagnostic transparent",
      "une garantie sur les piÃ¨ces et la main-dâ€™Å“uvre",
    ],
    audiences: ["un vÃ©hicule ancien", "une flotte professionnelle"],
  },
  {
    keywords: ["hotel", "hebergement", "chambre d'hote", "gite"],
    journey: "accommodation",
    questionLabel: "Quel hÃ©bergement",
    articleLabel: "un hÃ©bergement",
    pluralLabel: "hÃ©bergements",
    service: "un sÃ©jour",
    expertise: "lâ€™accueil touristique et les sÃ©jours locaux",
    localityScope: "hyperlocal",
    situations: [
      {
        need: "passer un week-end en couple",
        budget: "un week-end de deux nuits",
      },
      {
        need: "sÃ©journer en famille",
        budget: "un sÃ©jour familial",
      },
      {
        need: "organiser un dÃ©placement professionnel",
        budget: "une nuitÃ©e professionnelle",
      },
      {
        need: "venir avec un animal",
        budget: "un sÃ©jour avec un animal",
      },
    ],
    differentiators: [
      "un petit-dÃ©jeuner local",
      "un parking sur place",
      "une arrivÃ©e tardive",
    ],
    audiences: ["une famille", "un voyageur professionnel"],
  },
  {
    keywords: [
      "beaute",
      "esthetique",
      "institut",
      "spa",
    ],
    journey: "appointment",
    questionLabel: "Quel institut ou salon",
    articleLabel: "un institut ou salon",
    pluralLabel: "instituts et salons",
    service: "une prestation de beautÃ© ou de bien-Ãªtre",
    expertise: "les soins, la beautÃ© et le bien-Ãªtre",
    localityScope: "hyperlocal",
    situations: [
      {
        need: "prÃ©parer un mariage",
        budget: "une prÃ©paration beautÃ© pour un mariage",
      },
      {
        need: "changer de coupe ou de couleur",
        budget: "une coupe et une coloration",
      },
      {
        need: "rÃ©server un soin du visage",
        budget: "un soin du visage",
      },
      {
        need: "profiter dâ€™un moment de dÃ©tente",
        budget: "une sÃ©ance de bien-Ãªtre",
      },
    ],
    differentiators: [
      "des produits naturels",
      "un diagnostic personnalisÃ©",
      "des rendez-vous en soirÃ©e",
    ],
    audiences: ["une peau sensible", "une prÃ©paration de mariage"],
  },
  {
    keywords: ["coiffure", "coiffeur", "salon de coiffure", "barbier"],
    journey: "appointment",
    questionLabel: "Quel coiffeur ou salon de coiffure",
    articleLabel: "un coiffeur ou salon de coiffure",
    pluralLabel: "coiffeurs et salons de coiffure",
    service: "une coupe de cheveux",
    expertise: "la coiffure et les coupes de cheveux",
    localityScope: "hyperlocal",
    situations: [
      {
        need: "rÃ©server une coupe de cheveux",
        budget: "une coupe de cheveux",
      },
      {
        need: "obtenir un conseil avant une nouvelle coupe",
        budget: "une coupe avec conseil",
      },
      {
        need: "prendre rendez-vous rapidement",
        budget: "un rendez-vous de coiffure",
      },
      {
        need: "trouver une coupe adaptÃ©e Ã  son type de cheveux",
        budget: "une coupe personnalisÃ©e",
      },
    ],
    differentiators: [
      "un diagnostic personnalisÃ©",
      "des rendez-vous en soirÃ©e",
      "des produits naturels",
    ],
    audiences: ["des cheveux bouclÃ©s", "une prÃ©paration de mariage"],
  },
  {
    keywords: [
      "dentiste",
      "chirurgien dentiste",
      "cabinet dentaire",
      "soins dentaires",
    ],
    journey: "healthcare",
    questionLabel: "Quel dentiste",
    articleLabel: "un dentiste",
    pluralLabel: "dentistes",
    service: "des soins dentaires",
    expertise: "les consultations et les soins dentaires",
    localityScope: "hyperlocal",
    situations: [
      {
        need: "obtenir un premier rendez-vous",
        budget: "une premiÃ¨re consultation dentaire",
      },
      {
        need: "consulter pour une douleur dentaire",
        budget: "une consultation pour une douleur dentaire",
      },
      {
        need: "faire un contrÃ´le dentaire",
        budget: "un contrÃ´le dentaire",
      },
      {
        need: "consulter rapidement",
        budget: "une consultation dentaire rapide",
      },
    ],
    differentiators: [
      "une prise de rendez-vous en ligne",
      "des crÃ©neaux dâ€™urgence",
      "une approche pÃ©dagogique",
    ],
    audiences: ["un nouveau patient", "un suivi dentaire rÃ©gulier"],
  },
  {
    keywords: [
      "kinesitherapeute",
      "kine",
      "osteopathe",
      "psychologue",
      "cabinet medical",
      "sante",
    ],
    journey: "healthcare",
    questionLabel: "Quel praticien",
    articleLabel: "un praticien",
    pluralLabel: "praticiens",
    service: "un accompagnement de santÃ©",
    expertise: "lâ€™accompagnement et le suivi des patients",
    localityScope: "catchment",
    situations: [
      {
        need: "obtenir un premier rendez-vous",
        budget: "une premiÃ¨re consultation",
      },
      {
        need: "Ãªtre accompagnÃ© sur la durÃ©e",
        budget: "un suivi de plusieurs sÃ©ances",
      },
      {
        need: "consulter rapidement",
        budget: "une consultation",
      },
      {
        need: "trouver un praticien proche",
        budget: "un suivi rÃ©gulier proche de chez soi",
      },
    ],
    differentiators: [
      "une prise de rendez-vous en ligne",
      "des horaires Ã©tendus",
      "une approche pÃ©dagogique",
    ],
    audiences: ["un enfant", "un suivi rÃ©gulier"],
  },
  {
    keywords: ["avocat", "cabinet d avocat", "cabinet juridique"],
    questionLabel: "Quel avocat",
    articleLabel: "un avocat",
    pluralLabel: "avocats",
    service: "un dossier juridique",
    expertise: "le conseil juridique et lâ€™accompagnement des dossiers",
    localityScope: "catchment",
    situations: [
      {
        need: "obtenir un premier avis juridique",
        budget: "un premier rendez-vous juridique",
      },
      {
        need: "faire examiner un dossier",
        budget: "lâ€™examen dâ€™un dossier",
      },
      {
        need: "Ãªtre accompagnÃ© avant une procÃ©dure",
        budget: "un accompagnement juridique",
      },
      {
        need: "prendre en charge un dossier urgent",
        budget: "la prise en charge dâ€™un dossier urgent",
      },
    ],
    differentiators: [
      "un premier Ã©change rapide",
      "des honoraires transparents",
      "une expertise clairement documentÃ©e",
    ],
    audiences: ["un particulier", "une petite entreprise"],
  },
  {
    keywords: ["juridique", "notaire", "expert comptable", "comptable"],
    questionLabel: "Quel cabinet",
    articleLabel: "un cabinet",
    pluralLabel: "cabinets",
    service: "un accompagnement juridique ou financier",
    expertise: "le conseil et lâ€™accompagnement des dossiers",
    localityScope: "catchment",
    situations: [
      {
        need: "obtenir un premier avis",
        budget: "un premier rendez-vous de conseil",
      },
      {
        need: "crÃ©er une entreprise",
        budget: "lâ€™accompagnement Ã  la crÃ©ation dâ€™une entreprise",
      },
      {
        need: "rÃ©soudre un dossier urgent",
        budget: "la prise en charge dâ€™un dossier urgent",
      },
      {
        need: "Ãªtre accompagnÃ© sur la durÃ©e",
        budget: "un accompagnement annuel",
      },
    ],
    differentiators: [
      "un premier Ã©change rapide",
      "des honoraires transparents",
      "une expertise sectorielle",
    ],
    audiences: ["un particulier", "une petite entreprise"],
  },
  {
    keywords: [
      "commerce",
      "boutique",
      "magasin",
      "epicerie",
      "librairie",
      "fleuriste",
      "bijouterie",
      "chaussure",
      "pret a porter",
    ],
    questionLabel: "Quel commerce ou magasin",
    articleLabel: "un commerce ou magasin",
    pluralLabel: "commerces et magasins",
    service: "un achat en magasin",
    expertise: "la vente et le conseil aux clients",
    localityScope: "catchment",
    situations: [
      {
        need: "acheter un produit prÃ©cis",
        budget: "un achat en magasin",
      },
      {
        need: "trouver un produit avec un conseil personnalisÃ©",
        budget: "un achat avec conseil",
      },
      {
        need: "comparer plusieurs magasins locaux",
        budget: "un achat de proximitÃ©",
      },
      {
        need: "trouver une idÃ©e de cadeau",
        budget: "un cadeau",
      },
    ],
    differentiators: [
      "un conseil personnalisÃ©",
      "des produits locaux",
      "la rÃ©servation dâ€™un produit",
    ],
    audiences: ["un achat personnel", "un cadeau"],
  },
  {
    keywords: [
      "agence web",
      "marketing",
      "communication",
      "seo",
      "referencement",
      "developpement web",
      "consultant digital",
    ],
    questionLabel: "Quelle agence digitale",
    articleLabel: "une agence digitale",
    pluralLabel: "agences digitales",
    pluralQuestionWord: "Quelles",
    service: "un projet de visibilitÃ© numÃ©rique",
    expertise: "la crÃ©ation de sites, le rÃ©fÃ©rencement et lâ€™acquisition",
    localityScope: "catchment",
    situations: [
      {
        need: "crÃ©er un site internet",
        budget: "la crÃ©ation dâ€™un site internet",
      },
      {
        need: "amÃ©liorer le rÃ©fÃ©rencement local",
        budget: "un accompagnement en rÃ©fÃ©rencement local",
      },
      {
        need: "gÃ©nÃ©rer plus de demandes clients",
        budget: "une stratÃ©gie dâ€™acquisition numÃ©rique",
      },
      {
        need: "refondre un site existant",
        budget: "la refonte dâ€™un site internet",
      },
    ],
    differentiators: [
      "un suivi mensuel des rÃ©sultats",
      "une spÃ©cialisation pour les TPE",
      "un accompagnement SEO et IA",
    ],
    audiences: ["une entreprise locale", "un lancement dâ€™activitÃ©"],
  },
  {
    keywords: ["formation", "formateur", "ecole", "coaching", "coach"],
    questionLabel: "Quel organisme ou formateur",
    articleLabel: "un organisme ou formateur",
    pluralLabel: "organismes et formateurs",
    service: "une formation ou un accompagnement",
    expertise: "la formation et la montÃ©e en compÃ©tences",
    localityScope: "catchment",
    situations: [
      {
        need: "se reconvertir professionnellement",
        budget: "une formation de reconversion",
      },
      {
        need: "former une Ã©quipe",
        budget: "une formation en entreprise",
      },
      {
        need: "obtenir une certification",
        budget: "une formation certifiante",
      },
      {
        need: "progresser rapidement",
        budget: "un accompagnement individuel",
      },
    ],
    differentiators: [
      "une formation finanÃ§able",
      "un accompagnement personnalisÃ©",
      "des cours Ã  distance",
    ],
    audiences: ["une personne en reconversion", "une Ã©quipe en entreprise"],
  },
  {
    keywords: ["photographe", "video", "videaste", "evenementiel"],
    questionLabel: "Quel photographe ou vidÃ©aste",
    articleLabel: "un photographe ou vidÃ©aste",
    pluralLabel: "photographes et vidÃ©astes",
    service: "un projet photo ou vidÃ©o",
    expertise: "la crÃ©ation dâ€™images et la couverture dâ€™Ã©vÃ©nements",
    localityScope: "catchment",
    situations: [
      {
        need: "couvrir un mariage",
        budget: "un reportage de mariage",
      },
      {
        need: "rÃ©aliser des portraits professionnels",
        budget: "une sÃ©ance de portraits professionnels",
      },
      {
        need: "crÃ©er des photos de produits",
        budget: "un shooting de produits",
      },
      {
        need: "filmer un Ã©vÃ©nement",
        budget: "la captation vidÃ©o dâ€™un Ã©vÃ©nement",
      },
    ],
    differentiators: [
      "une livraison rapide",
      "un portfolio dans le style recherchÃ©",
      "une formule photo et vidÃ©o",
    ],
    audiences: ["un mariage", "une entreprise locale"],
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function serviceNeedPhrase(value: string) {
  const service = value.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  if (
    /^(un|une|des|du|de la|de l|l |le |la )\b/.test(service) ||
    /^(amenager|acheter|contacter|decorer|dejeuner|diner|estimer|installer|organiser|reparer|renover|reserver|vendre)\b/.test(
      normalize(service)
    )
  ) {
    return service;
  }
  if (/^droit\b/.test(service)) return `un accompagnement en ${service}`;
  if (/(s|x)$/.test(service.split(" ")[0] ?? "")) return `des ${service}`;
  if (
    /^(consultation|decoration|estimation|gestion|location|optimisation|prestation|reparation|renovation|revision|vente)\b/.test(
      normalize(service)
    )
  ) {
    return `une ${service}`;
  }
  return `un ${service}`;
}

function audiencePhrase(value: string) {
  const audience = value.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  if (/^(un|une|des|du|de la|de l|l |le |la )\b/.test(audience)) {
    return audience;
  }
  return `des ${audience}`;
}

function pluralizeLeadingActivityNoun(activity: string) {
  const [leadingNoun = "", ...rest] = activity.split(" ");
  const pluralLeadingNoun = /[sxz]$/i.test(leadingNoun)
    ? leadingNoun
    : `${leadingNoun}s`;
  return [pluralLeadingNoun, ...rest].join(" ");
}

function genericActivityLabels(category: string) {
  const activity = category.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");
  if (!activity) {
    return {
      questionLabel: "Quel prestataire local",
      articleLabel: "un prestataire local",
      pluralLabel: "prestataires locaux",
      pluralQuestionWord: "Quels" as const,
      pluralAgreement: "notÃ©s" as const,
    };
  }

  const normalizedActivity = normalize(activity);
  const directActivity =
    /^(entreprise|agence|boutique|societe|cabinet|atelier|magasin|commerce|salon|service)\b/.test(
      normalizedActivity
    );
  if (directActivity) {
    const feminine =
      /^(entreprise|agence|boutique|societe)\b/.test(normalizedActivity);
    return {
      questionLabel: `${feminine ? "Quelle" : "Quel"} ${activity}`,
      articleLabel: `${feminine ? "une" : "un"} ${activity}`,
      pluralLabel: pluralizeLeadingActivityNoun(activity),
      pluralQuestionWord: feminine ? ("Quelles" as const) : ("Quels" as const),
      pluralAgreement: feminine ? ("notÃ©es" as const) : ("notÃ©s" as const),
    };
  }

  return {
    questionLabel: `Quel spÃ©cialiste en ${activity}`,
    articleLabel: `un spÃ©cialiste en ${activity}`,
    pluralLabel: `spÃ©cialistes en ${activity}`,
    pluralQuestionWord: "Quels" as const,
    pluralAgreement: "notÃ©s" as const,
  };
}

function genericProfile(category: string): ActivityProfile {
  const activity =
    category.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr") ||
    "service local";
  const labels = genericActivityLabels(category);
  return {
    keywords: [],
    ...labels,
    service: `un besoin en ${activity}`,
    expertise: `les prestations de ${activity}`,
    localityScope: "catchment",
    situations: [
      {
        need: `rÃ©aliser un projet de ${activity}`,
        budget: `une prestation de ${activity}`,
      },
      {
        need: `obtenir un accompagnement personnalisÃ© en ${activity}`,
        budget: `un accompagnement personnalisÃ© en ${activity}`,
      },
      {
        need: `rÃ©soudre un besoin urgent en ${activity}`,
        budget: `une intervention rapide en ${activity}`,
      },
      {
        need: `comparer plusieurs solutions de ${activity}`,
        budget: `un projet complet de ${activity}`,
      },
    ],
    differentiators: [
      "un devis ou tarif transparent",
      "des rÃ©fÃ©rences clients vÃ©rifiables",
      "un accompagnement personnalisÃ©",
    ],
    audiences: ["un particulier", "une petite entreprise"],
  };
}

type LocalityScope = "hyperlocal" | "catchment";

function normalizeLocation(value: string) {
  const candidate = value.replace(/\s+/g, " ").trim();
  return candidate || "la zone recherchée";
}

function locationPhrase(
  location: string,
  profileScope: LocalityScope = "catchment"
) {
  const normalized = normalizeLocation(location);
  if (profileScope === "hyperlocal") {
    return `à ${normalized}`;
  }
  return `dans la zone de chalandise de ${normalized}`;
}

function localQuestionLocation(
  company: CompanyContext,
  profile: ActivityProfile,
  questionType: "local" | "broad" = "local"
) {
  const location =
    company.serviceAreas?.find((area) => area.trim()) ||
    company.location ||
    "la zone recherchée";
  if (questionType === "broad" && profile.localityScope === "catchment") {
    return `dans la zone de chalandise de ${normalizeLocation(location)}`;
  }
  return locationPhrase(location, profile.localityScope);
}

function chooseProfile(company: CompanyContext) {
  const searchable = normalize(
    `${company.category} ${company.description ?? ""}`
  );
  return (
    profiles.find((profile) =>
      profile.keywords.some((keyword) => searchable.includes(normalize(keyword)))
    ) ?? genericProfile(company.category)
  );
}

export type QuestionGenerationContext = {
  businessType: string;
  customerGoal: string;
  forbiddenInterpretations: string[];
  examples: string[];
};

export function getQuestionGenerationContext(
  company: CompanyContext
): QuestionGenerationContext {
  const profile = chooseProfile(company);
  const location = localQuestionLocation(company, profile, "broad");

  if (profile.journey === "restaurant") {
    return {
      businessType: "Ã©tablissement oÃ¹ le client vient manger ou commande un repas",
      customerGoal:
        "choisir une table, dÃ©jeuner, dÃ®ner, rÃ©server ou vÃ©rifier un critÃ¨re pratique avant de venir",
      forbiddenInterpretations: [
        "chercher un professionnel pour crÃ©er, ouvrir, amÃ©nager ou Ã©quiper un restaurant",
        "traiter le restaurant comme le projet professionnel du client",
        "demander un devis, une intervention ou un accompagnement de crÃ©ation dâ€™entreprise",
      ],
      examples: [
        `Quels restaurants recommandez-vous Ã  ${location} ?`,
        `OÃ¹ bien manger Ã  ${location} ?`,
        `Quel restaurant offre le meilleur rapport qualitÃ©-prix Ã  ${location} ?`,
      ],
    };
  }

  if (profile.journey === "accommodation") {
    return {
      businessType: "hÃ©bergement que le client souhaite rÃ©server",
      customerGoal:
        "choisir un hÃ©bergement, organiser un sÃ©jour et vÃ©rifier les conditions pratiques",
      forbiddenInterpretations: [
        "chercher un professionnel pour construire, rÃ©nover ou gÃ©rer un hÃ´tel",
        "traiter lâ€™hÃ©bergement comme un projet immobilier du client",
      ],
      examples: [
        `Quel hÃ©bergement choisir Ã  ${location} pour un week-end ?`,
        `Quels hÃ©bergements recommandez-vous Ã  ${location} ?`,
      ],
    };
  }

  if (profile.journey === "appointment") {
    return {
      businessType: "professionnel recevant le client sur rendez-vous",
      customerGoal:
        "choisir une prestation, vÃ©rifier son adÃ©quation et prendre rendez-vous",
      forbiddenInterpretations: [
        "chercher Ã  crÃ©er ou amÃ©nager un salon ou un institut",
        "transformer la catÃ©gorie en projet professionnel du client",
      ],
      examples: [
        `${profile.questionLabel} choisir Ã  ${location} ?`,
        `OÃ¹ prendre rendez-vous avec ${profile.articleLabel} Ã  ${location} ?`,
      ],
    };
  }

  if (profile.journey === "healthcare") {
    return {
      businessType: "praticien que le patient souhaite consulter",
      customerGoal:
        "trouver un praticien adaptÃ©, obtenir un rendez-vous et vÃ©rifier les modalitÃ©s du suivi",
      forbiddenInterpretations: [
        "chercher Ã  crÃ©er, amÃ©nager ou Ã©quiper un cabinet",
        "formuler une question destinÃ©e Ã  un professionnel de santÃ© plutÃ´t quâ€™Ã  un patient",
      ],
      examples: [
        `Quel praticien choisir Ã  ${location} ?`,
        `Quel praticien est disponible rapidement Ã  ${location} ?`,
      ],
    };
  }

  return {
    businessType: "prestataire que le client peut choisir et contacter",
    customerGoal:
      "rÃ©soudre un besoin concret, comparer les options, vÃ©rifier la confiance, le prix ou la disponibilitÃ©",
    forbiddenInterpretations: [
      "rÃ©pÃ©ter mÃ©caniquement la catÃ©gorie aprÃ¨s Â« projet de Â» sans comprendre le besoin final",
      "inventer un service ou un type de clientÃ¨le absent de la description",
    ],
    examples: [
      `${profile.questionLabel} recommandez-vous Ã  ${location} ?`,
      `${profile.questionLabel} est fiable et recommandÃ© Ã  ${location} ?`,
    ],
  };
}

export function isQuestionRelevantForCompany(
  text: string,
  company: CompanyContext
) {
  return validateQuestionForCompany(text, company).accepted;
}

function restaurantLabels(category: string) {
  const normalizedCategory = normalize(category);
  if (normalizedCategory.includes("bistronom")) {
    return {
      singular: "restaurant bistronomique",
      plural: "restaurants bistronomiques",
      singularQuestionWord: "Quel",
      pluralQuestionWord: "Quels",
    };
  }
  if (normalizedCategory.includes("brasserie")) {
    return {
      singular: "brasserie",
      plural: "brasseries",
      singularQuestionWord: "Quelle",
      pluralQuestionWord: "Quelles",
    };
  }
  if (normalizedCategory.includes("bistrot")) {
    return {
      singular: "bistrot",
      plural: "bistrots",
      singularQuestionWord: "Quel",
      pluralQuestionWord: "Quels",
    };
  }
  if (normalizedCategory.includes("pizzeria")) {
    return {
      singular: "pizzeria",
      plural: "pizzerias",
      singularQuestionWord: "Quelle",
      pluralQuestionWord: "Quelles",
    };
  }
  if (normalizedCategory.includes("creperie")) {
    return {
      singular: "crÃªperie",
      plural: "crÃªperies",
      singularQuestionWord: "Quelle",
      pluralQuestionWord: "Quelles",
    };
  }
  if (normalizedCategory.includes("sushi")) {
    return {
      singular: "restaurant de sushis",
      plural: "restaurants de sushis",
      singularQuestionWord: "Quel",
      pluralQuestionWord: "Quels",
    };
  }
  if (normalizedCategory.includes("cafe")) {
    return {
      singular: "cafÃ©",
      plural: "cafÃ©s",
      singularQuestionWord: "Quel",
      pluralQuestionWord: "Quels",
    };
  }
  return {
    singular: "restaurant",
    plural: "restaurants",
    singularQuestionWord: "Quel",
    pluralQuestionWord: "Quels",
  };
}

function restaurantQuestionCandidates(
  company: CompanyContext
): QuestionCandidate[] {
  const profile = chooseProfile(company);
  const location = localQuestionLocation(company, profile, "local");
  const labels = restaurantLabels(company.category);
  const reasonByIntent: Record<string, string> = {
    DÃ©couverte: "Reproduit une recherche naturelle faite avant de choisir oÃ¹ manger.",
    Comparaison: "Compare les Ã©tablissements lorsque le client hÃ©site entre plusieurs options.",
    "Besoin prÃ©cis": "Teste un critÃ¨re concret susceptible de dÃ©clencher une rÃ©servation.",
    Prix: "Couvre une question de budget posÃ©e avant de rÃ©server.",
    Confiance: "VÃ©rifie les preuves qui rassurent avant de choisir.",
    DisponibilitÃ©: "Teste une contrainte pratique qui peut dÃ©cider du choix.",
    Marque: "ContrÃ´le ce que les IA comprennent et recommandent sur lâ€™Ã©tablissement.",
  };
  const seeds: Array<[string, string]> = [
    [
      `${labels.pluralQuestionWord} ${labels.plural} recommandez-vous Ã  ${location} ?`,
      "DÃ©couverte",
    ],
    [`OÃ¹ bien manger Ã  ${location} ?`, "DÃ©couverte"],
    [`OÃ¹ dÃ©jeuner Ã  ${location} ?`, "DÃ©couverte"],
    [`OÃ¹ dÃ®ner Ã  ${location} ce soir ?`, "DisponibilitÃ©"],
    [
      `${labels.pluralQuestionWord} ${labels.plural} sont les mieux notÃ©s Ã  ${location} ?`,
      "Confiance",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} offre le meilleur rapport qualitÃ©-prix Ã  ${location} ?`,
      "Comparaison",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} choisir Ã  ${location} pour une occasion spÃ©ciale ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} choisir Ã  ${location} pour un dÃ®ner en couple ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} choisir Ã  ${location} pour un repas en famille ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.pluralQuestionWord} ${labels.plural} Ã  ${location} accueillent bien les groupes ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} Ã  ${location} propose de bonnes options vÃ©gÃ©tariennes ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} Ã  ${location} convient en cas dâ€™allergies alimentaires ?`,
      "Besoin prÃ©cis",
    ],
    [
      `OÃ¹ manger des produits locaux et de saison Ã  ${location} ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.singularQuestionWord} ${labels.singular} avec terrasse choisir Ã  ${location} ?`,
      "Besoin prÃ©cis",
    ],
    [
      `OÃ¹ organiser un repas professionnel Ã  ${location} ?`,
      "Besoin prÃ©cis",
    ],
    [
      `OÃ¹ dÃ®ner Ã  deux Ã  ${location} avec un bon rapport qualitÃ©-prix ?`,
      "Comparaison",
    ],
    [
      `${labels.pluralQuestionWord} ${labels.plural} proposent un menu du midi Ã  bon prix Ã  ${location} ?`,
      "Prix",
    ],
    [
      `${labels.pluralQuestionWord} ${labels.plural} Ã  ${location} sont recommandÃ©s pour dÃ®ner Ã  prix raisonnable ?`,
      "Prix",
    ],
    [
      `${labels.pluralQuestionWord} ${labels.plural} sont ouverts le dimanche Ã  ${location} ?`,
      "DisponibilitÃ©",
    ],
    [
      `Dans ${labels.pluralQuestionWord.toLocaleLowerCase("fr")} ${labels.plural} peut-on rÃ©server en ligne Ã  ${location} ?`,
      "DisponibilitÃ©",
    ],
    [
      `OÃ¹ peut-on dÃ®ner sans rÃ©servation Ã  ${location} ?`,
      "DisponibilitÃ©",
    ],
    [
      `${labels.pluralQuestionWord} ${labels.plural} Ã  ${location} sont souvent recommandÃ©s pour la qualitÃ© du service ?`,
      "Confiance",
    ],
    [
      `OÃ¹ manger une cuisine faite maison Ã  ${location} ?`,
      "Besoin prÃ©cis",
    ],
    [
      `${labels.pluralQuestionWord} ${labels.plural} sont apprÃ©ciÃ©s par les habitants de ${location} ?`,
      "Confiance",
    ],
    [`Est-ce que ${company.name} est recommandÃ© Ã  ${location} ?`, "Marque"],
  ];

  return seeds.map(([text, intent], index) => ({
    text,
    intent,
    reason: reasonByIntent[intent],
    value: 100 - index,
  }));
}

export function generateQuestionCandidates(
  company: CompanyContext
): QuestionCandidate[] {
  const profile = chooseProfile(company);
  const location = localQuestionLocation(company, profile, "broad");
  const pluralQuestionWord = profile.pluralQuestionWord ?? "Quels";
  if (profile.journey === "restaurant") {
    return selectDistinctQuestionCandidates(
      restaurantQuestionCandidates(company),
      company
    );
  }
  const questions: QuestionCandidate[] = [];
  const explicitServices = [...new Set(company.services ?? [])]
    .map((service) => service.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 12);
  const supportedSituations = (
    explicitServices.length
      ? explicitServices.map((service) => ({
          need: serviceNeedPhrase(service),
          budget: service.toLocaleLowerCase("fr"),
        }))
      : []
  );
  const supportedDifferentiators = [
    ...new Set(company.differentiators ?? []),
  ]
    .map((differentiator) => differentiator.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 8);
  const supportedAudiences = [...new Set(company.audiences ?? [])]
    .map(audiencePhrase)
    .filter(Boolean)
    .slice(0, 8);
  const primaryService = explicitServices[0]
    ? serviceNeedPhrase(explicitServices[0])
    : "";
  const supportedExpertise = explicitServices.length
    ? explicitServices
        .map((service) => service.toLocaleLowerCase("fr"))
        .join(" et ")
        .slice(0, 180)
    : "";

  let nextValue = 100;
  const add = (text: string, intent: string, reason: string) => {
    questions.push({ text, intent, reason, value: nextValue });
    nextValue -= 1;
  };
  const addBrandQuestions = () => {
    add(
      `Est-ce que ${company.name} est recommandÃ© Ã  ${location} ?`,
      "Marque",
      "VÃ©rifie la recommandation directe de votre entreprise."
    );
  };

  add(
    primaryService
      ? `${profile.questionLabel} recommandez-vous Ã  ${location} pour ${primaryService} ?`
      : `${profile.questionLabel} recommandez-vous Ã  ${location} ?`,
    "DÃ©couverte",
    "Teste une recommandation directe formulÃ©e avec les mots de votre activitÃ©."
  );
  add(
    `${pluralQuestionWord} ${profile.pluralLabel} sont les mieux ${profile.pluralAgreement ?? "notÃ©s"} Ã  ${location} ?`,
    "RÃ©putation",
    "VÃ©rifie si les avis et la rÃ©putation vous placent dans la sÃ©lection."
  );
  if (supportedExpertise) {
    add(
      `Qui est spÃ©cialisÃ© dans ${supportedExpertise} Ã  ${location} ?`,
      "SpÃ©cialitÃ©",
      "Mesure votre association avec le cÅ“ur prÃ©cis de votre savoir-faire."
    );
  }
  add(
    `${profile.questionLabel} offre le meilleur rapport qualitÃ©-prix Ã  ${location} ?`,
    "Comparaison",
    "Teste une comparaison oÃ¹ le prix et la confiance comptent ensemble."
  );
  add(
    `${pluralQuestionWord} ${profile.pluralLabel} sont prÃ©sents dans ${localQuestionLocation(
      company,
      profile,
      "broad"
    )} ?`,
    "Local",
    "Mesure votre prÃ©sence dans une recherche gÃ©ographique Ã©largie."
  );
  add(
    `${profile.questionLabel} choisir prÃ¨s de ${location} ?`,
    "Local",
    "Teste une recherche locale courte trÃ¨s proche dâ€™une prise de contact."
  );
  if (!profile.journey) {
    add(
      `${pluralQuestionWord} ${profile.pluralLabel} contacter Ã  ${location} ?`,
      "DisponibilitÃ©",
      "Teste une recherche locale qui mÃ¨ne directement Ã  une prise de contact."
    );
    add(
      `${profile.questionLabel} est disponible rapidement Ã  ${location} ?`,
      "DisponibilitÃ©",
      "Teste une contrainte de dÃ©lai sans supposer quâ€™un service prÃ©cis est proposÃ©."
    );
  }
  supportedSituations.forEach((situation) => {
    add(
      `${profile.questionLabel} choisir pour ${situation.need} Ã  ${location} ?`,
      "Besoin prÃ©cis",
      "Teste votre visibilitÃ© sur un besoin concret propre Ã  votre activitÃ©."
    );
    add(
      `${profile.questionLabel} offre le meilleur rapport qualitÃ©-prix Ã  ${location} pour ${situation.need} ?`,
      "Comparaison",
      "Compare les entreprises sur un service explicitement confirmÃ©."
    );
    if (
      profile.journey === "appointment" ||
      profile.journey === "healthcare"
    ) {
      add(
        `${profile.questionLabel} est disponible Ã  ${location} pour ${situation.need} ?`,
        "DisponibilitÃ©",
        "VÃ©rifie la possibilitÃ© de rÃ©server le service confirmÃ©."
      );
    } else if (profile.journey === "accommodation") {
      add(
        `${profile.questionLabel} rÃ©server Ã  ${location} pour ${situation.need} ?`,
        "DisponibilitÃ©",
        "Teste une intention de rÃ©servation cohÃ©rente avec le sÃ©jour."
      );
    } else {
      add(
        `Qui contacter Ã  ${location} pour ${situation.need} ?`,
        "DisponibilitÃ©",
        "Teste une prise de contact pour un service explicitement confirmÃ©."
      );
    }
  });

  supportedDifferentiators.forEach((differentiator) => {
    add(
      `Qui propose ${differentiator} Ã  ${location} ?`,
      "SpÃ©cialitÃ©",
      "Teste un avantage susceptible de vous diffÃ©rencier dans les rÃ©ponses."
    );
  });

  supportedAudiences.forEach((audience) => {
    add(
      `${profile.questionLabel} choisir pour ${audience} Ã  ${location} ?`,
      "ClientÃ¨le",
      "VÃ©rifie votre visibilitÃ© auprÃ¨s dâ€™un segment de clientÃ¨le pertinent."
    );
    add(
      `${profile.questionLabel} recommandez-vous Ã  ${location} pour ${audience} ?`,
      "ClientÃ¨le",
      "Teste une recommandation directe adaptÃ©e Ã  ce profil de client."
    );
  });
  addBrandQuestions();

  return selectDistinctQuestionCandidates(questions, company).sort(
    (left, right) => right.value - left.value
  );
}


