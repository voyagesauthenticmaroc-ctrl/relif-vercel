// TEST
export type QuestionCompanyContext = {
  name: string;
  website?: string;
  category: string;
  location: string;
  description?: string;
  services?: string[];
  audiences?: string[];
  serviceAreas?: string[];
  differentiators?: string[];
  proofPoints?: string[];
};

export type QuestionDecisionIntent =
  | "choose"
  | "reserve"
  | "buy"
  | "contact";

export type QuestionValidation = {
  accepted: boolean;
  reason:
    | "accepted"
    | "unnatural-formulation"
    | "non-decision-intent"
    | "incompatible-activity"
    | "unsupported-service"
    | "uncertain-activity-link";
  decisionIntent: QuestionDecisionIntent | null;
  signature: string;
};

type ActivitySector =
  | "restaurant"
  | "garage"
  | "plumber"
  | "cleaning"
  | "hotel"
  | "lawyer"
  | "dentist"
  | "hairdresser"
  | "real-estate"
  | "decorator"
  | "commerce"
  | "other";

type SectorRule = {
  sector: Exclude<ActivitySector, "other">;
  categoryPattern: RegExp;
  questionPattern: RegExp;
  incompatiblePattern?: RegExp;
};

type EvidenceGate = {
  questionPattern: RegExp;
  evidencePattern: RegExp;
};

export function normalizeQuestionValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const sectorRules: SectorRule[] = [
  {
    sector: "restaurant",
    categoryPattern:
      /\b(restaurant\w*|restauration|brasserie\w*|bistrot\w*|pizzeria\w*|creperie\w*|sushi\w*|cafe\w*|traiteur\w*)\b/,
    questionPattern:
      /\b(restaurant\w*|brasserie\w*|bistrot\w*|pizzeria\w*|creperie\w*|sushi\w*|traiteur\w*|manger|dejeuner|diner|repas|table)\b/,
    incompatiblePattern:
      /\b(interv(?:en|ien)\w*|devis|depannage|amenager|construire|equiper|ouvrir)\b/,
  },
  {
    sector: "garage",
    categoryPattern:
      /\b(garage|automobile|mecanicien|mecanique auto|carrosserie)\b/,
    questionPattern:
      /\b(garage\w*|mecanicien\w*|automobile\w*|vehicule\w*|voiture\w*|revision\w*|reparation auto|carrosserie\w*|embrayage\w*)\b/,
  },
  {
    sector: "plumber",
    categoryPattern:
      /\b(plombier|plomberie|chauffagiste|chauffage|sanitaire)\b/,
    questionPattern:
      /\b(plombier\w*|plomberie|fuite\w*|canalisation\w*|chauffe eau|sanitaire\w*|chauffage)\b/,
  },
  {
    sector: "cleaning",
    categoryPattern:
      /\b(entreprise de nettoyage|societe de nettoyage|nettoyage|proprete|menage)\b/,
    questionPattern:
      /\b(entreprise\w* de nettoyage|societe\w* de nettoyage|nettoyage|proprete|menage|nettoyer|entretenir)\b/,
  },
  {
    sector: "hotel",
    categoryPattern:
      /\b(hotel\w*|hebergement\w*|chambre\w* d hote\w*|gite\w*|auberge\w*)\b/,
    questionPattern:
      /\b(hotel\w*|hebergement\w*|chambre\w* d hote\w*|gite\w*|auberge\w*|sejour\w*|nuit\w*|dormir)\b/,
    incompatiblePattern:
      /\b(interv(?:en|ien)\w*|devis|depannage|construire|renover|equiper)\b/,
  },
  {
    sector: "lawyer",
    categoryPattern:
      /\b(avocat|cabinet juridique|juridique|notaire|droit)\b/,
    questionPattern:
      /\b(avocat\w*|juridique\w*|droit|cabinet d avocat\w*|honoraire\w*|dossier\w*|conseil legal)\b/,
  },
  {
    sector: "dentist",
    categoryPattern:
      /\b(dentiste|chirurgien dentiste|cabinet dentaire|soins dentaires)\b/,
    questionPattern:
      /\b(dentiste\w*|dentair\w*|dent\w*|cabinet dentaire|consultation dentaire|implant\w*|orthodont\w*)\b/,
    incompatiblePattern:
      /\b(amenager|equiper|ouvrir|construire)\b.*\bcabinet\b/,
  },
  {
    sector: "hairdresser",
    categoryPattern:
      /\b(coiffeur|coiffure|salon de coiffure|barbier)\b/,
    questionPattern:
      /\b(coiffeur\w*|coiffure\w*|salon\w* de coiffure|barbier\w*|coupe\w* de cheveux|coloration\w*|balayage\w*)\b/,
    incompatiblePattern:
      /\b(amenager|equiper|ouvrir|construire)\b.*\bsalon\b/,
  },
  {
    sector: "real-estate",
    categoryPattern:
      /\b(agent immobilier|agence immobiliere|immobilier|transaction immobiliere)\b/,
    questionPattern:
      /\b(agent\w* immobilier\w*|agence\w* immobiliere\w*|immobilier\w*|logement\w*|maison\w*|appartement\w*|bien\w* a vendre|estimation immobiliere)\b/,
  },
  {
    sector: "decorator",
    categoryPattern:
      /\b(decorateur|decoration interieure|amenagement interieur|architecture interieure|home staging)\b/,
    questionPattern:
      /\b(decorateur\w*|decoration\w* interieure\w*|amenagement\w* interieur\w*|architecte\w* d interieur|amenager|decorer)\b/,
  },
  {
    sector: "commerce",
    categoryPattern:
      /\b(commerce|boutique|magasin|epicerie|librairie|fleuriste|bijouterie|chaussures?|pret a porter)\b/,
    questionPattern:
      /\b(commerce\w*|boutique\w*|magasin\w*|epicerie\w*|librairie\w*|fleuriste\w*|bijouterie\w*|chaussure\w*|pret a porter|produit\w*)\b/,
    incompatiblePattern: /\b(interv(?:en|ien)\w*|depannage|devis)\b/,
  },
];

const evidenceGates: Partial<Record<ActivitySector, EvidenceGate[]>> = {
  restaurant: [
    {
      questionPattern: /\b(dejeuner|midi)\b/,
      evidencePattern: /\b(dejeuner|midi|service du midi)\b/,
    },
    {
      questionPattern: /\b(diner|soir|soiree)\b/,
      evidencePattern: /\b(diner|soir|soiree|service du soir)\b/,
    },
    {
      questionPattern: /\b(vegetar\w*|vegan\w*)\b/,
      evidencePattern: /\b(vegetar\w*|vegan\w*)\b/,
    },
    {
      questionPattern: /\b(allerg\w*|sans gluten)\b/,
      evidencePattern: /\b(allerg\w*|sans gluten)\b/,
    },
    {
      questionPattern: /\bterrasse\b/,
      evidencePattern: /\bterrasse\b/,
    },
    {
      questionPattern: /\b(produits? locaux|de saison|fait maison)\b/,
      evidencePattern: /\b(produits? locaux|de saison|fait maison)\b/,
    },
    {
      questionPattern: /\b(groupe\w*|professionnel\w*|entreprise\w*)\b/,
      evidencePattern: /\b(groupe\w*|professionnel\w*|entreprise\w*)\b/,
    },
    {
      questionPattern: /\b(livraison|a emporter)\b/,
      evidencePattern: /\b(livraison|a emporter)\b/,
    },
    {
      questionPattern:
        /\b(dimanche|reservation en ligne|reserver en ligne|sans reservation)\b/,
      evidencePattern:
        /\b(dimanche|reservation en ligne|reserver en ligne|sans reservation)\b/,
    },
    {
      questionPattern: /\b(menu du midi)\b/,
      evidencePattern: /\b(menu du midi|dejeuner)\b/,
    },
    {
      questionPattern: /\b(occasion speciale|diner en couple|diner a deux)\b/,
      evidencePattern: /\b(occasion speciale|couple\w*|diner a deux)\b/,
    },
  ],
  garage: [
    {
      questionPattern: /\bembrayage\b/,
      evidencePattern: /\bembrayage\b/,
    },
    {
      questionPattern: /\bcarrosserie\b/,
      evidencePattern: /\bcarrosserie\b/,
    },
    {
      questionPattern: /\b(pneus?|freins?)\b/,
      evidencePattern: /\b(pneus?|freins?)\b/,
    },
    {
      questionPattern: /\b(vehicule de pret|voiture de pret)\b/,
      evidencePattern: /\b(vehicule de pret|voiture de pret)\b/,
    },
  ],
  plumber: [
    {
      questionPattern: /\bchauffe eau\b/,
      evidencePattern: /\bchauffe eau\b/,
    },
    {
      questionPattern: /\bcanalisation\b/,
      evidencePattern: /\bcanalisation\b/,
    },
    {
      questionPattern: /\b(salle de bain|sanitaire)\b/,
      evidencePattern: /\b(salle de bain|sanitaire)\b/,
    },
    {
      questionPattern: /\bchauffage\b/,
      evidencePattern: /\b(chauffage|chauffagiste)\b/,
    },
  ],
  cleaning: [
    {
      questionPattern: /\b(bureau\w*|locaux professionnels?)\b/,
      evidencePattern: /\b(bureau\w*|locaux professionnels?)\b/,
    },
    {
      questionPattern: /\b(vitre\w*|vitrerie)\b/,
      evidencePattern: /\b(vitre\w*|vitrerie)\b/,
    },
    {
      questionPattern: /\b(fin de chantier|apres chantier)\b/,
      evidencePattern: /\b(fin de chantier|apres chantier)\b/,
    },
    {
      questionPattern: /\b(parties communes|copropriete|immeuble)\b/,
      evidencePattern: /\b(parties communes|copropriete|immeuble)\b/,
    },
    {
      questionPattern:
        /\b(laboratoire|industriel|desinfection|salle blanche)\b/,
      evidencePattern:
        /\b(laboratoire|industriel|desinfection|salle blanche)\b/,
    },
    {
      questionPattern: /\b(domicile|menage a domicile)\b/,
      evidencePattern: /\b(domicile|menage a domicile)\b/,
    },
    {
      questionPattern: /\b(moquette|tapis)\b/,
      evidencePattern: /\b(moquette|tapis)\b/,
    },
  ],
  hotel: [
    {
      questionPattern: /\bparking\b/,
      evidencePattern: /\bparking\b/,
    },
    {
      questionPattern: /\bpetit dejeuner\b/,
      evidencePattern: /\bpetit dejeuner\b/,
    },
    {
      questionPattern: /\b(animal|animaux)\b/,
      evidencePattern: /\b(animal|animaux)\b/,
    },
    {
      questionPattern: /\b(spa|piscine|restaurant)\b/,
      evidencePattern: /\b(spa|piscine|restaurant)\b/,
    },
    {
      questionPattern: /\b(arrivee tardive|reception 24)\b/,
      evidencePattern: /\b(arrivee tardive|reception 24)\b/,
    },
  ],
  lawyer: [
    {
      questionPattern:
        /\b(divorce|separation|garde d enfant|droit de la famille)\b/,
      evidencePattern:
        /\b(divorce|separation|garde d enfant|droit de la famille)\b/,
    },
    {
      questionPattern:
        /\b(droit penal|penal|garde a vue|tribunal correctionnel)\b/,
      evidencePattern:
        /\b(droit penal|penal|garde a vue|tribunal correctionnel)\b/,
    },
    {
      questionPattern:
        /\b(droit des affaires|creation d entreprise|societe|commercial)\b/,
      evidencePattern:
        /\b(droit des affaires|creation d entreprise|societe|commercial)\b/,
    },
    {
      questionPattern: /\b(immigration|titre de sejour|etrangers)\b/,
      evidencePattern: /\b(immigration|titre de sejour|etrangers)\b/,
    },
  ],
  dentist: [
    {
      questionPattern: /\b(implant\w*|implantologie)\b/,
      evidencePattern: /\b(implant\w*|implantologie)\b/,
    },
    {
      questionPattern: /\b(orthodontie|orthodontiste|appareil dentaire)\b/,
      evidencePattern: /\b(orthodontie|orthodontiste|appareil dentaire)\b/,
    },
    {
      questionPattern: /\b(blanchiment|esthetique dentaire)\b/,
      evidencePattern: /\b(blanchiment|esthetique dentaire)\b/,
    },
    {
      questionPattern: /\b(enfant|pediatrique)\b/,
      evidencePattern: /\b(enfant|pediatrique)\b/,
    },
    {
      questionPattern: /\b(rendez vous en ligne)\b/,
      evidencePattern: /\b(rendez vous en ligne)\b/,
    },
  ],
  hairdresser: [
    {
      questionPattern: /\b(coloration|balayage|meches)\b/,
      evidencePattern: /\b(coloration|balayage|meches)\b/,
    },
    {
      questionPattern: /\b(mariage|mariee)\b/,
      evidencePattern: /\b(mariage|mariee)\b/,
    },
    {
      questionPattern: /\bbarbe\b/,
      evidencePattern: /\b(barbe|barbier)\b/,
    },
    {
      questionPattern: /\b(produits? naturels?|bio)\b/,
      evidencePattern: /\b(produits? naturels?|bio)\b/,
    },
    {
      questionPattern: /\b(diagnostic personnalise)\b/,
      evidencePattern: /\b(diagnostic personnalise)\b/,
    },
    {
      questionPattern: /\b(soir|soiree)\b/,
      evidencePattern: /\b(soir|soiree)\b/,
    },
  ],
  "real-estate": [
    {
      questionPattern: /\b(location|gestion locative|mettre en location)\b/,
      evidencePattern: /\b(location|gestion locative|mettre en location)\b/,
    },
    {
      questionPattern: /\b(investissement|investisseur)\b/,
      evidencePattern: /\b(investissement|investisseur)\b/,
    },
    {
      questionPattern: /\b(immobilier commercial|local commercial)\b/,
      evidencePattern: /\b(immobilier commercial|local commercial)\b/,
    },
  ],
  decorator: [
    {
      questionPattern: /\b(home staging)\b/,
      evidencePattern: /\b(home staging)\b/,
    },
    {
      questionPattern: /\b(3d|projection|plan)\b/,
      evidencePattern: /\b(3d|projection|plan)\b/,
    },
    {
      questionPattern: /\b(ecoresponsable|ecologique|durable)\b/,
      evidencePattern: /\b(ecoresponsable|ecologique|durable)\b/,
    },
    {
      questionPattern: /\b(renover|renovation)\b/,
      evidencePattern: /\b(renover|renovation)\b/,
    },
  ],
  commerce: [
    {
      questionPattern: /\b(produits? locaux)\b/,
      evidencePattern: /\b(produits? locaux)\b/,
    },
    {
      questionPattern: /\b(conseil personnalise)\b/,
      evidencePattern: /\b(conseil personnalise)\b/,
    },
    {
      questionPattern: /\b(reservation d un produit|reserver un produit)\b/,
      evidencePattern: /\b(reservation d un produit|reserver un produit)\b/,
    },
  ],
};

const audienceGates: EvidenceGate[] = [
  {
    questionPattern: /\b(famille\w*|enfant\w*)\b/,
    evidencePattern: /\b(famille\w*|enfant\w*)\b/,
  },
  {
    questionPattern: /\b(couple\w*)\b/,
    evidencePattern: /\b(couple\w*)\b/,
  },
  {
    questionPattern: /\b(groupe\w*)\b/,
    evidencePattern: /\b(groupe\w*)\b/,
  },
  {
    questionPattern: /\b(professionnel\w*|entreprise\w*)\b/,
    evidencePattern: /\b(professionnel\w*|entreprise\w*)\b/,
  },
  {
    questionPattern: /\b(particulier\w*)\b/,
    evidencePattern: /\b(particulier\w*)\b/,
  },
  {
    questionPattern: /\b(investisseur\w*|investissement locatif)\b/,
    evidencePattern: /\b(investisseur\w*|investissement locatif)\b/,
  },
];

const operationalEvidenceGates: EvidenceGate[] = [
  {
    questionPattern: /\b(ponctuel\w*|une seule fois)\b/,
    evidencePattern: /\b(ponctuel\w*|une seule fois)\b/,
  },
  {
    questionPattern: /\b(sur rendez vous)\b/,
    evidencePattern: /\b(sur rendez vous|rendez vous)\b/,
  },
  {
    questionPattern: /\b(urgent\w*|urgence\w*)\b/,
    evidencePattern: /\b(urgent\w*|urgence\w*)\b/,
  },
];

const ignoredActivityTokens = new Set([
  "activite",
  "accompagnement",
  "avec",
  "cabinet",
  "commerce",
  "dans",
  "des",
  "entreprise",
  "et",
  "local",
  "pour",
  "prestation",
  "professionnel",
  "service",
  "services",
  "societe",
]);

const semanticStopWords = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "ce",
  "cette",
  "chez",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "est",
  "et",
  "il",
  "la",
  "le",
  "les",
  "bon",
  "bonne",
  "bons",
  "bonnes",
  "mieux",
  "moins",
  "on",
  "ou",
  "par",
  "parmi",
  "plus",
  "pour",
  "pres",
  "que",
  "quel",
  "quelle",
  "quelles",
  "quels",
  "qui",
  "ses",
  "son",
  "sur",
  "un",
  "une",
  "vous",
]);

function companyEvidence(company: QuestionCompanyContext) {
  return normalizeQuestionValue(
    [
      company.category,
      company.description,
      ...(company.services ?? []),
      ...(company.audiences ?? []),
      ...(company.serviceAreas ?? []),
      ...(company.differentiators ?? []),
      ...(company.proofPoints ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function sectorForCompany(company: QuestionCompanyContext): ActivitySector {
  const category = normalizeQuestionValue(company.category);
  return (
    sectorRules.find((rule) => rule.categoryPattern.test(category))?.sector ??
    "other"
  );
}

function significantTokens(value: string) {
  return normalizeQuestionValue(value)
    .split(" ")
    .filter(
      (token) =>
        token.length >= 4 &&
        !ignoredActivityTokens.has(token) &&
        !/^\d+$/.test(token)
    );
}

function connectsToActivity(
  question: string,
  company: QuestionCompanyContext,
  sector: ActivitySector
) {
  const companyName = normalizeQuestionValue(company.name);
  if (companyName.length >= 3 && question.includes(companyName)) return true;
  const sectorRule = sectorRules.find((rule) => rule.sector === sector);
  if (sectorRule?.questionPattern.test(question)) return true;

  const evidenceTerms = [
    ...significantTokens(company.category),
    ...(company.services ?? []).flatMap(significantTokens),
  ];
  return evidenceTerms.some((term) => question.includes(term));
}

function incompatibleWithActivity(
  question: string,
  evidence: string,
  sector: ActivitySector
) {
  const ownRule = sectorRules.find((rule) => rule.sector === sector);
  if (ownRule?.incompatiblePattern?.test(question)) return true;

  return sectorRules.some(
    (rule) =>
      rule.sector !== sector &&
      rule.questionPattern.test(question) &&
      !rule.questionPattern.test(evidence)
  );
}

function mentionsUnsupportedService(
  question: string,
  evidence: string,
  sector: ActivitySector
) {
  return [
    ...(evidenceGates[sector] ?? []),
    ...audienceGates,
    ...operationalEvidenceGates,
  ].some(
    (gate) =>
      gate.questionPattern.test(question) &&
      !gate.evidencePattern.test(evidence)
  );
}

function decisionIntent(
  question: string,
  sector: ActivitySector,
  activityConnected: boolean
): QuestionDecisionIntent | null {
  if (
    /\b(reserver|reservation|rendez vous|disponible|disponibilite|ouvert|prendre rendez vous)\b/.test(
      question
    ) ||
    (["restaurant", "hotel", "dentist", "hairdresser"].includes(sector) &&
      /\b(manger|dejeuner|diner|dormir|sejourner|consulter)\b/.test(question))
  ) {
    return "reserve";
  }
  if (
    /\b(acheter|commander|achat|ou trouver|boutique|magasin)\b/.test(question)
  ) {
    return "buy";
  }
  if (
    /\b(contacter|faire appel|interv(?:en|ien)\w*|depannage|devis|urgence|prendre en charge|accompagner)\b/.test(
      question
    )
  ) {
    return "contact";
  }
  if (
    /\b(recommand|conseill|choisir|meilleur|mieux note|fiable|serieux|reputation|connu|notoriete|comparer|comparaison|difference|rapport qualite prix)\w*\b/.test(
      question
    ) ||
    (activityConnected &&
      /^(qui|quel|quelle|quels|quelles)\b.*\b(propose|offre|vend|specialise)\w*\b/.test(
        question
      ))
  ) {
    return "choose";
  }
  return null;
}

function canonicalSemanticToken(token: string) {
  if (/^(recommand|conseill|chois|meilleur|selection)/.test(token)) {
    return "selection";
  }
  if (/^(compar|difference)/.test(token)) return "comparison";
  if (/^(reserv|rendez)/.test(token)) return "booking";
  if (/^(disponib|ouvert|horaire)/.test(token)) return "availability";
  if (/^(achet|command)/.test(token)) return "purchase";
  if (/^(contact|interven|depann|devis)/.test(token)) return "contact";
  if (
    /^(fiabl|confiance|reput|avis|note|serieu|credibl|rassur|professionnal|connu|notoriete)/.test(
      token
    )
  ) {
    return "trust";
  }
  if (/^(prix|tarif|budget|cout)/.test(token)) return "price";
  if (/^(amenag)/.test(token)) return "amenag";
  if (/^(renov)/.test(token)) return "renov";
  if (/^(repar)/.test(token)) return "repar";
  if (/^(vehicule|voiture|automobile)/.test(token)) return "auto";
  if (/^(hebergement|hotel|gite|auberge)/.test(token)) return "lodging";
  if (/^(restaurant|brasserie|bistrot|pizzeria|creperie)/.test(token)) {
    return "restaurant";
  }
  if (token.length > 5 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function semanticTokens(
  text: string,
  company: QuestionCompanyContext,
  sector: ActivitySector
) {
  const ignored = new Set([
    ...semanticStopWords,
    ...significantTokens(company.name),
    ...significantTokens(company.category),
    ...significantTokens(company.location),
  ]);
  const ownRule = sectorRules.find((rule) => rule.sector === sector);
  const normalized = normalizeQuestionValue(text)
    .replace(
      /\b(recommandez vous|est ce que|faut il|prendre rendez vous|faire appel)\b/g,
      " "
    )
    .replace(/\s+/g, " ");

  return [
    ...new Set(
      normalized
        .split(" ")
        .map(canonicalSemanticToken)
        .filter(
          (token) =>
            token.length >= 3 &&
            !ignored.has(token) &&
            !semanticStopWords.has(token) &&
            !["selection", "booking", "purchase", "contact"].includes(token) &&
            !/^\d+$/.test(token)
        )
        .filter((token) => {
          if (!ownRule) return true;
          return !ownRule.categoryPattern.test(token);
        })
    ),
  ].sort();
}

function signatureForQuestion(
  text: string,
  company: QuestionCompanyContext,
  intent: QuestionDecisionIntent | null
) {
  const sector = sectorForCompany(company);
  const tokens = semanticTokens(text, company, sector);
  return `${intent ?? "unknown"}:${sector}:${tokens.join("-") || "general"}`;
}

export function validateQuestionForCompany(
  text: string,
  company: QuestionCompanyContext
): QuestionValidation {
  const question = normalizeQuestionValue(text);
  const sector = sectorForCompany(company);
  const evidence = companyEvidence(company);
  const activityConnected = connectsToActivity(question, company, sector);
  const intent = decisionIntent(question, sector, activityConnected);
  const signature = signatureForQuestion(text, company, intent);
  const wordCount = question ? question.split(" ").length : 0;
  const vagueOrArtificialDecision =
    /\b((besoin|service|demande)\s+(tres\s+)?simple|demandes?\s+les?\s+plus\s+simples?|premier(e)?\s+(demande|contact)|contact\s+(rapide|simple|clair)|prise\s+de\s+contact|echange\s+simple|sans\s+(engagement|complication|contrainte|lourdeur)|facile\w*\s+a\s+(joindre|contacter)|au\s+premier\s+abord|eviter\s+(de\s+)?(perdre\s+du\s+temps|les?\s+mauvaises?\s+surprises?)|comparer\s+(avant|plusieurs\s+options)|compare\s+surtout)\b/.test(
      question
    ) ||
    /\b(facile\w* a contacter aujourd hui|repond\w* le plus vite)\b/.test(
      question
    );

  if (
    !text.trim().endsWith("?") ||
    wordCount < 5 ||
    wordCount > 32 ||
    !/^(quel|quelle|quels|quelles|qui|ou|est ce que|peut on|faut il|dans quel|dans quelle|dans quels|dans quelles|parmi|comment contacter|comment prendre|a quel|a quelle)\b/.test(
      question
    ) ||
    /\b(?:professionnels?|specialistes?|prestataires?)\s+de\s+(?:entreprise|agence|boutique|societe)\b/.test(
      question
    ) ||
    /\bprojet\s+de\s+(?:entreprise|agence|boutique|societe)\b/.test(
      question
    ) ||
    vagueOrArtificialDecision ||
    /\b(besoin numero|question numero|service numero|prestation numero|repas numero|piece numero|cette activite|votre region|mot cle|seo)\b/.test(
      question
    )
  ) {
    return {
      accepted: false,
      reason: "unnatural-formulation",
      decisionIntent: intent,
      signature,
    };
  }

  if (
    /^(combien coute|combien faut il|quel budget|quels sont les tarifs moyens|quel est le prix moyen|quels criteres|comment trouver|comment choisir|comment comparer|que faut il|pourquoi|quels avis|quelles informations|quels services|quelles prestations|quels sont les tarifs de|quels sont les horaires|ou se trouve|que peut on|comment fonctionne)\b/.test(
      question
    ) ||
    /^ou (trouver|lire|consulter|verifier)\b.*\bavis\b/.test(question) ||
    /\b(meilleurs? professionnels?|quel professionnel|quels professionnels)\b.*\bprojet\b/.test(
      question
    ) ||
    /\bprojet\b.*\b(meilleurs? professionnels?|quel professionnel|quels professionnels)\b/.test(
      question
    ) ||
    /\b(quel type de|quelle sorte de|quelle cuisine choisir)\b/.test(
      question
    ) ||
    /\bpresente (ses|les) tarifs le plus clairement\b/.test(question) ||
    /\bont le plus d avis positifs\b/.test(question)
  ) {
    return {
      accepted: false,
      reason: "non-decision-intent",
      decisionIntent: null,
      signature,
    };
  }

  if (incompatibleWithActivity(question, evidence, sector)) {
    return {
      accepted: false,
      reason: "incompatible-activity",
      decisionIntent: intent,
      signature,
    };
  }

  if (mentionsUnsupportedService(question, evidence, sector)) {
    return {
      accepted: false,
      reason: "unsupported-service",
      decisionIntent: intent,
      signature,
    };
  }

  if (!activityConnected) {
    return {
      accepted: false,
      reason: "uncertain-activity-link",
      decisionIntent: intent,
      signature,
    };
  }

  if (!intent) {
    return {
      accepted: false,
      reason: "non-decision-intent",
      decisionIntent: null,
      signature,
    };
  }

  return {
    accepted: true,
    reason: "accepted",
    decisionIntent: intent,
    signature,
  };
}

function tokenSimilarity(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;
  return union ? intersection / union : 1;
}

export function areQuestionsSemanticallyEquivalent(
  left: string,
  right: string,
  company: QuestionCompanyContext
) {
  if (normalizeQuestionValue(left) === normalizeQuestionValue(right)) return true;

  const sector = sectorForCompany(company);
  const normalizedCompanyName = normalizeQuestionValue(company.name);
  const leftIsBranded =
    normalizedCompanyName.length >= 3 &&
    normalizeQuestionValue(left).includes(normalizedCompanyName);
  const rightIsBranded =
    normalizedCompanyName.length >= 3 &&
    normalizeQuestionValue(right).includes(normalizedCompanyName);
  if (leftIsBranded !== rightIsBranded) return false;
  const leftConnected = connectsToActivity(
    normalizeQuestionValue(left),
    company,
    sector
  );
  const rightConnected = connectsToActivity(
    normalizeQuestionValue(right),
    company,
    sector
  );
  const leftIntent = decisionIntent(
    normalizeQuestionValue(left),
    sector,
    leftConnected
  );
  const rightIntent = decisionIntent(
    normalizeQuestionValue(right),
    sector,
    rightConnected
  );
  if (!leftIntent || !rightIntent) return false;

  const leftTokens = semanticTokens(left, company, sector);
  const rightTokens = semanticTokens(right, company, sector);
  if (!leftTokens.length || !rightTokens.length) {
    return leftTokens.length === rightTokens.length;
  }
  if (leftTokens.join("|") === rightTokens.join("|")) return true;
  if (leftIntent !== rightIntent) return false;
  return tokenSimilarity(leftTokens, rightTokens) >= 0.72;
}

export function selectDistinctQuestionCandidates<
  T extends { text: string },
>(
  candidates: T[],
  company: QuestionCompanyContext,
  existingQuestions: string[] = []
) {
  const retained: T[] = [];
  const knownQuestions = existingQuestions
    .map((question) => question.trim())
    .filter(Boolean);

  candidates.forEach((candidate) => {
    if (!validateQuestionForCompany(candidate.text, company).accepted) return;
    if (
      [...knownQuestions, ...retained.map((item) => item.text)].some((question) =>
        areQuestionsSemanticallyEquivalent(candidate.text, question, company)
      )
    ) {
      return;
    }
    retained.push(candidate);
  });

  return retained;
}
