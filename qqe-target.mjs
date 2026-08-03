import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  areQuestionsSemanticallyEquivalent,
  selectDistinctQuestionCandidates,
  validateQuestionForCompany,
} from "../lib/question-quality.ts";
import { generateQuestionCandidates } from "../lib/question-generator.ts";

const sectorCases = [
  {
    sector: "restaurant",
    company: {
      name: "Table Test",
      category: "Restaurant",
      location: "Caen",
      description: "Déjeuner et dîner sur réservation.",
      services: ["Déjeuner", "Dîner"],
      audiences: ["Couples", "Familles"],
      serviceAreas: ["Caen"],
      proofPoints: ["Menu publié"],
    },
    valid: "Quel restaurant recommandez-vous à Caen pour dîner ?",
    invalid: "Quels restaurants interviennent autour de Caen ?",
    unsupported:
      "Quel restaurant recommandez-vous à Caen pour un déjeuner végétarien ?",
  },
  {
    sector: "garage",
    company: {
      name: "Garage Test",
      category: "Garage automobile",
      location: "Caen",
      description: "Révision et réparation automobile.",
      services: ["Révision automobile", "Réparation automobile"],
      audiences: ["Particuliers"],
      serviceAreas: ["Caen"],
      proofPoints: ["Tarifs de révision publiés"],
    },
    valid: "Quel garage contacter à Caen pour réparer une voiture ?",
    invalid: "Quel garage recommandez-vous à Caen pour réparer une fuite d’eau ?",
    unsupported: "Quel garage choisir à Caen pour remplacer un embrayage ?",
  },
  {
    sector: "plombier",
    company: {
      name: "Plomberie Test",
      category: "Plombier",
      location: "Caen",
      description: "Dépannage de plomberie et réparation de fuites.",
      services: ["Réparation de fuite", "Dépannage plomberie"],
      audiences: ["Particuliers"],
      serviceAreas: ["Caen"],
      proofPoints: ["Assurance professionnelle vérifiée"],
    },
    valid: "Quel plombier contacter à Caen pour réparer une fuite d’eau ?",
    invalid: "Quel plombier choisir à Caen pour remplacer un embrayage ?",
    unsupported: "Quel plombier contacter à Caen pour remplacer un chauffe-eau ?",
  },
  {
    sector: "hôtel",
    company: {
      name: "Hôtel Test",
      category: "Hôtel",
      location: "Caen",
      description: "Chambres pour séjours professionnels et familiaux.",
      services: ["Nuitée", "Séjour familial"],
      audiences: ["Familles", "Voyageurs professionnels"],
      serviceAreas: ["Caen"],
      proofPoints: ["Classement hôtelier publié"],
    },
    valid: "Quel hôtel réserver à Caen pour un séjour en famille ?",
    invalid: "Quel hôtel contacter à Caen pour un dépannage de chaudière ?",
    unsupported: "Quel hôtel réserver à Caen avec un parking ?",
  },
  {
    sector: "avocat",
    company: {
      name: "Cabinet Test",
      category: "Avocat",
      location: "Caen",
      description: "Conseil et contentieux en droit du travail.",
      services: ["Droit du travail"],
      audiences: ["Salariés", "Employeurs"],
      serviceAreas: ["Caen"],
      proofPoints: ["Inscription au barreau vérifiée"],
    },
    valid: "Quel avocat contacter à Caen pour faire examiner un dossier juridique ?",
    invalid: "Quel avocat choisir à Caen pour une procédure de divorce ?",
    unsupported: "Quel avocat choisir à Caen pour une procédure de divorce ?",
  },
  {
    sector: "dentiste",
    company: {
      name: "Dentiste Test",
      category: "Dentiste",
      location: "Caen",
      description: "Consultations et soins dentaires courants.",
      services: ["Consultation dentaire", "Soins dentaires courants"],
      audiences: ["Adultes"],
      serviceAreas: ["Caen"],
      proofPoints: ["Professionnel de santé enregistré"],
    },
    valid: "Quel dentiste est disponible à Caen pour une consultation dentaire ?",
    invalid: "Quel dentiste recommandez-vous à Caen pour des implants dentaires ?",
    unsupported:
      "Quel dentiste recommandez-vous à Caen pour des implants dentaires ?",
  },
  {
    sector: "coiffeur",
    company: {
      name: "Coiffure Test",
      category: "Salon de coiffure",
      location: "Caen",
      description: "Coupes de cheveux sur rendez-vous.",
      services: ["Coupe de cheveux"],
      audiences: ["Adultes"],
      serviceAreas: ["Caen"],
      proofPoints: ["Galerie de coupes publiée"],
    },
    valid: "Quel coiffeur choisir à Caen pour une coupe de cheveux ?",
    invalid: "Quel coiffeur recommandez-vous à Caen pour un balayage ?",
    unsupported: "Quel coiffeur recommandez-vous à Caen pour un balayage ?",
  },
  {
    sector: "agent immobilier",
    company: {
      name: "Immobilier Test",
      category: "Agence immobilière",
      location: "Caen",
      description: "Vente, achat et estimation de logements.",
      services: ["Vente immobilière", "Achat immobilier", "Estimation"],
      audiences: ["Propriétaires", "Acheteurs"],
      serviceAreas: ["Caen"],
      proofPoints: ["Carte professionnelle vérifiée"],
    },
    valid: "Quelle agence immobilière recommandez-vous à Caen pour vendre une maison ?",
    invalid: "Quelle agence immobilière réserver à Caen pour une nuit d’hôtel ?",
    unsupported:
      "Quelle agence immobilière contacter à Caen pour une gestion locative ?",
  },
  {
    sector: "décorateur",
    company: {
      name: "Décoration Test",
      category: "Décorateur d’intérieur",
      location: "Caen",
      description: "Conseil et aménagement intérieur.",
      services: ["Aménagement intérieur", "Conseil décoration"],
      audiences: ["Particuliers"],
      serviceAreas: ["Caen"],
      proofPoints: ["Portfolio publié"],
    },
    valid: "Quel décorateur contacter à Caen pour un aménagement intérieur ?",
    invalid: "Quel décorateur choisir à Caen pour poser des implants dentaires ?",
    unsupported: "Quel décorateur choisir à Caen pour du home staging ?",
  },
  {
    sector: "commerce",
    company: {
      name: "Chaussures Test",
      category: "Boutique de chaussures",
      location: "Caen",
      description: "Vente de chaussures de ville en magasin.",
      services: ["Vente de chaussures de ville"],
      audiences: ["Adultes"],
      serviceAreas: ["Caen"],
      proofPoints: ["Catalogue de chaussures publié"],
    },
    valid:
      "Quelle boutique de chaussures recommandez-vous à Caen pour acheter des chaussures de ville ?",
    invalid:
      "Quelle boutique de chaussures contacter à Caen pour réparer une fuite d’eau ?",
    unsupported:
      "Quelle boutique de chaussures choisir à Caen pour acheter des produits locaux ?",
  },
];

test("the deterministic sector evaluation accepts decisions and rejects false services", () => {
  assert.equal(sectorCases.length, 10);

  sectorCases.forEach(({ sector, company, valid, invalid, unsupported }) => {
    assert.equal(
      validateQuestionForCompany(valid, company).accepted,
      true,
      `${sector}: ${valid}`
    );
    assert.equal(
      validateQuestionForCompany(invalid, company).accepted,
      false,
      `${sector}: ${invalid}`
    );
    assert.equal(
      validateQuestionForCompany(unsupported, company).accepted,
      false,
      `${sector}: ${unsupported}`
    );
  });
});

test("the local fallback stays valid and distinct across all evaluation sectors", () => {
  sectorCases.forEach(({ sector, company }) => {
    const generated = generateQuestionCandidates(company);
    assert.ok(generated.length > 0, `${sector}: empty fallback`);
    generated.forEach((question, index) => {
      assert.equal(
        validateQuestionForCompany(question.text, company).accepted,
        true,
        `${sector}: ${question.text}`
      );
      generated.slice(index + 1).forEach((candidate) => {
        assert.equal(
          areQuestionsSemanticallyEquivalent(
            question.text,
            candidate.text,
            company
          ),
          false,
          `${sector}: ${question.text} / ${candidate.text}`
        );
      });
    });
  });
});

test("explicitly blocks the forbidden restaurant wording", () => {
  const restaurant = sectorCases[0].company;
  const validation = validateQuestionForCompany(
    "Quels restaurants interviennent autour de Caen ?",
    restaurant
  );

  assert.equal(validation.accepted, false);
  assert.equal(validation.reason, "incompatible-activity");
});

test("rejects mechanically assembled business-category grammar", () => {
  const cleaning = {
    name: "SNEP",
    category: "Entreprise de nettoyage",
    location: "Ifs",
    description: "",
    services: [],
    audiences: [],
    serviceAreas: ["Ifs"],
    proofPoints: [],
  };
  const malformed = [
    "Quel professionnel de entreprise de nettoyage recommandez-vous à Ifs ?",
    "Quels professionnels de entreprise de nettoyage recommandez-vous à Ifs ?",
    "Quel spécialiste de entreprise de nettoyage choisir à Ifs ?",
    "Quels spécialistes de entreprise de nettoyage choisir à Ifs ?",
    "Quel prestataire pour un projet de entreprise de nettoyage à Ifs ?",
  ];

  malformed.forEach((question) => {
    const validation = validateQuestionForCompany(question, cleaning);
    assert.equal(validation.accepted, false, question);
    assert.equal(validation.reason, "unnatural-formulation", question);
  });
});

test("rejects vague, artificial and unverifiable sales-process wording", () => {
  const cleaning = {
    name: "SNEP",
    category: "Entreprise de nettoyage",
    location: "Ifs",
    description: "",
    services: [],
    audiences: [],
    serviceAreas: ["Ifs"],
    proofPoints: [],
  };
  const artificialQuestions = [
    "Quelle entreprise de nettoyage à Ifs choisir si je veux un prestataire local et facile à joindre ?",
    "Quelle entreprise de nettoyage à Ifs conseillez-vous pour un besoin simple sans engagement compliqué ?",
    "Quelle entreprise de nettoyage à Ifs me recommandez-vous si je veux comparer avant d’appeler ?",
    "Quelle entreprise de nettoyage à Ifs a l’air la plus professionnelle au premier abord ?",
    "Quelles entreprises de nettoyage à Ifs sont les plus faciles à contacter aujourd’hui ?",
    "Quelle entreprise de nettoyage à Ifs me conseillez-vous pour un service simple et rapide ?",
    "Quelle entreprise de nettoyage à Ifs est la plus crédible si je veux éviter de perdre du temps ?",
    "Quelle entreprise de nettoyage à Ifs recommandez-vous pour une prise de contact sans complication ?",
    "Quelle entreprise de nettoyage à Ifs recommandez-vous pour comparer plusieurs options ?",
    "Quelle entreprise de nettoyage à Ifs prend en charge les demandes les plus simples ?",
  ];

  artificialQuestions.forEach((question) => {
    const validation = validateQuestionForCompany(question, cleaning);
    assert.equal(validation.accepted, false, question);
  });
});

test("requires an explicit customer decision and confirmed cleaning services", () => {
  const sparseCleaning = {
    name: "SNEP",
    category: "Entreprise de nettoyage",
    location: "Ifs",
    description: "",
    services: [],
    audiences: [],
    serviceAreas: ["Ifs"],
    proofPoints: [],
  };

  [
    "Quelle entreprise de nettoyage danse à Ifs ?",
    "Quelle entreprise de nettoyage collectionne des timbres à Ifs ?",
    "Quelle entreprise de nettoyage existe à Ifs ?",
    "Quelle entreprise de nettoyage recommandez-vous pour laver des vitres à Ifs ?",
    "Quelle entreprise de nettoyage recommandez-vous pour désinfecter un laboratoire à Ifs ?",
    "Quelle entreprise de nettoyage à Ifs accepte les demandes urgentes ?",
    "Quelle entreprise de nettoyage à Ifs propose une intervention sur rendez-vous ?",
  ].forEach((question) => {
    assert.equal(
      validateQuestionForCompany(question, sparseCleaning).accepted,
      false,
      question
    );
  });

  assert.equal(
    validateQuestionForCompany(
      "Quelle entreprise de nettoyage recommandez-vous à Ifs ?",
      sparseCleaning
    ).accepted,
    true
  );
  assert.equal(
    validateQuestionForCompany(
      "Quelles entreprises de nettoyage interviennent autour de Ifs ?",
      sparseCleaning
    ).accepted,
    true
  );

  const informedCleaning = {
    ...sparseCleaning,
    description:
      "Nettoyage de vitres et désinfection de laboratoires sur rendez-vous.",
    services: ["Nettoyage de vitres", "Désinfection de laboratoires"],
  };
  assert.equal(
    validateQuestionForCompany(
      "Quelle entreprise de nettoyage recommandez-vous pour laver des vitres à Ifs ?",
      informedCleaning
    ).accepted,
    true
  );
  assert.equal(
    validateQuestionForCompany(
      "Quelle entreprise de nettoyage recommandez-vous pour désinfecter un laboratoire à Ifs ?",
      informedCleaning
    ).accepted,
    true
  );
});

test("rejects natural-looking questions that do not lead to a decision", () => {
  const restaurant = sectorCases[0].company;
  const weakQuestions = [
    "Quels sont les tarifs moyens des restaurants à Caen ?",
    "Quels critères vérifier avant de choisir un restaurant à Caen ?",
    "Où consulter des avis fiables sur les restaurants à Caen ?",
    "Quelles prestations propose Table Test à Caen ?",
  ];

  weakQuestions.forEach((question) => {
    assert.equal(
      validateQuestionForCompany(question, restaurant).accepted,
      false,
      question
    );
  });
});

test("detects different formulations carrying the same local intention", () => {
  const plumber = sectorCases[2].company;
  const first = "Quel plombier choisir à Caen pour réparer une fuite d’eau ?";
  const second = "Qui recommandez-vous à Caen pour la réparation d’une fuite d’eau ?";
  const contact = "Qui contacter à Caen pour réparer une fuite d’eau ?";

  assert.equal(
    areQuestionsSemanticallyEquivalent(first, second, plumber),
    true
  );
  assert.equal(
    areQuestionsSemanticallyEquivalent(first, contact, plumber),
    true
  );
  assert.equal(
    areQuestionsSemanticallyEquivalent(
      "Est-ce que Plomberie Test est recommandée à Caen ?",
      "Quel plombier recommandez-vous à Caen ?",
      plumber
    ),
    false
  );

  const retained = selectDistinctQuestionCandidates(
    [
      { text: first, value: 90 },
      { text: second, value: 89 },
      {
        text: "Quel plombier contacter à Caen pour un dépannage de plomberie ?",
        value: 88,
      },
    ],
    plumber
  );
  assert.equal(retained.length, 2);
});

test("uses a local deterministic method without an embeddings dependency", async () => {
  const source = await readFile(
    new URL("../lib/question-quality.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /embedding|vector|fetch\(/i);
  assert.match(source, /tokenSimilarity/);
  assert.match(source, /validateQuestionForCompany/);
});
