import assert from "node:assert/strict";
import test from "node:test";
import {
  generateQuestionCandidates,
  isQuestionRelevantForCompany,
} from "../lib/question-generator.ts";
import { areQuestionsSemanticallyEquivalent } from "../lib/question-quality.ts";

const company = (category, profile = {}) => ({
  name: "Entreprise Test",
  category,
  location: "Caen",
  description: "",
  services: [],
  audiences: [],
  serviceAreas: ["Caen"],
  differentiators: [],
  proofPoints: [],
  ...profile,
});

test("builds a conservative local reserve from confirmed profile facts", () => {
  const decoration = company("Décoration et aménagement intérieur", {
    description:
      "Aménagement de salon, rénovation décorative et plans 3D pour particuliers.",
    services: [
      "Aménagement de salon",
      "Rénovation décorative",
      "Plans 3D",
    ],
    audiences: ["Particuliers"],
    differentiators: ["Plans 3D"],
    proofPoints: ["Portfolio de réalisations publié"],
  });
  const questions = generateQuestionCandidates(decoration);

  assert.ok(questions.length >= 10);
  assert.ok(
    questions.every((question) =>
      isQuestionRelevantForCompany(question.text, decoration)
    )
  );
  assert.match(
    questions.map((question) => question.text).join("\n"),
    /aménagement de salon|rénovation décorative|plans 3d/i
  );
  assert.doesNotMatch(
    questions.map((question) => question.text).join("\n"),
    /home staging|écor(esponsable|esponsable)|petit appartement/i
  );

  questions.forEach((question, index) => {
    questions.slice(index + 1).forEach((candidate) => {
      assert.equal(
        areQuestionsSemanticallyEquivalent(
          question.text,
          candidate.text,
          decoration
        ),
        false,
        `${question.text} / ${candidate.text}`
      );
    });
  });
});

test("adapts the fallback to restaurant, plumbing and real-estate journeys", () => {
  const restaurant = company("Restaurant bistronomique", {
    description:
      "Déjeuner, dîner, options végétariennes, terrasse et accueil des familles.",
    services: ["Déjeuner", "Dîner", "Options végétariennes"],
    audiences: ["Familles"],
    differentiators: ["Terrasse"],
  });
  const plumbing = company("Plomberie", {
    description: "Réparation de fuites d’eau.",
    services: ["Réparation de fuite"],
    audiences: ["Particuliers"],
  });
  const realEstate = company("Agence immobilière", {
    description: "Vente, achat et estimation de logements.",
    services: ["Vente immobilière", "Achat immobilier", "Estimation"],
    audiences: ["Propriétaires", "Acheteurs"],
  });

  const restaurantQuestions = generateQuestionCandidates(restaurant);
  const plumbingQuestions = generateQuestionCandidates(plumbing);
  const realEstateQuestions = generateQuestionCandidates(realEstate);

  assert.ok(
    restaurantQuestions.some((question) =>
      question.text.includes("options végétariennes")
    )
  );
  assert.ok(
    restaurantQuestions.some((question) =>
      question.text.includes("Où bien manger à Caen")
    )
  );
  assert.doesNotMatch(
    restaurantQuestions.map((question) => question.text).join("\n"),
    /interviennent autour|projet de restaurant|allergies alimentaires/i
  );
  assert.ok(
    plumbingQuestions.some((question) =>
      question.text.toLocaleLowerCase("fr").includes("réparation de fuite")
    )
  );
  assert.doesNotMatch(
    plumbingQuestions.map((question) => question.text).join("\n"),
    /chauffe-eau|canalisation|salle de bain/i
  );
  assert.ok(
    realEstateQuestions.some((question) =>
      question.text.toLocaleLowerCase("fr").includes("vente immobilière")
    )
  );
  assert.doesNotMatch(
    realEstateQuestions.map((question) => question.text).join("\n"),
    /gestion locative|investissement locatif/i
  );
});

test("blocks supplier-side and non-decision restaurant questions", () => {
  const restaurant = company("Restaurant bistronomique", {
    description: "Déjeuner et dîner.",
    services: ["Déjeuner", "Dîner"],
  });
  const rejected = [
    "Quels sont les meilleurs professionnels pour un projet de restaurant à Caen ?",
    "Quels restaurants interviennent autour de Caen ?",
    "Quels sont les tarifs moyens des restaurants à Caen ?",
    "Quel budget prévoir à Caen pour un déjeuner ou un dîner ?",
    "Quels restaurants ont le plus d’avis positifs à Caen ?",
    "Comment trouver un restaurant fiable à Caen ?",
    "Quels critères vérifier avant de choisir un restaurant à Caen ?",
    "Où consulter des avis fiables sur les restaurants à Caen ?",
    "Quel type de restaurant choisir à Caen ?",
    "Quelle cuisine choisir pour un dîner à Caen ?",
  ];

  rejected.forEach((question) => {
    assert.equal(
      isQuestionRelevantForCompany(question, restaurant),
      false,
      question
    );
  });
  assert.equal(
    isQuestionRelevantForCompany(
      "Quel restaurant recommandez-vous à Caen pour dîner ?",
      restaurant
    ),
    true
  );
});

test("keeps nearby food activities in the correct customer journey", () => {
  const pizzeria = generateQuestionCandidates(
    company("Pizzeria", {
      description: "Pizzas sur place le midi et le soir.",
      services: ["Déjeuner", "Dîner"],
    })
  );
  const caterer = generateQuestionCandidates(
    company("Traiteur événementiel", {
      description: "Buffets et repas de mariage.",
      services: ["Buffet", "Repas de mariage"],
    })
  );

  assert.match(pizzeria[0].text, /^Quelles pizzerias/i);
  assert.match(caterer[0].text, /traiteur.*buffet/i);
  assert.doesNotMatch(
    [...pizzeria, ...caterer].map((question) => question.text).join("\n"),
    /professionnels?.*projet de (?:restaurant|pizzeria|traiteur)|interviennent autour/i
  );
});

test("falls back cautiously to an unknown entered activity", () => {
  const watchRepair = company("Réparation de montres anciennes", {
    description: "Réparation mécanique de montres anciennes.",
    services: ["Réparation mécanique de montres"],
    audiences: ["Collectionneurs"],
  });
  const questions = generateQuestionCandidates(watchRepair);

  assert.ok(questions.length > 0);
  assert.ok(
    questions.every((question) =>
      isQuestionRelevantForCompany(question.text, watchRepair)
    )
  );
  assert.match(
    questions.map((question) => question.text).join("\n"),
    /réparation (?:mécanique de montres|de montres anciennes)/i
  );
  assert.match(
    questions.map((question) => question.text).join("\n"),
    /spécialiste en réparation de montres anciennes/i
  );
  assert.doesNotMatch(
    questions.map((question) => question.text).join("\n"),
    /professionnel de réparation/i
  );
});

test("builds a natural and conservative SNEP reserve from a sparse cleaning profile", () => {
  const snep = company("Entreprise de nettoyage", {
    name: "SNEP",
    location: "Ifs",
    serviceAreas: ["Ifs"],
  });
  const questions = generateQuestionCandidates(snep);
  const nonBrandQuestions = questions.filter(
    (question) => question.intent !== "Marque"
  );
  const brandQuestions = questions.filter(
    (question) => question.intent === "Marque"
  );
  const combined = questions.map((question) => question.text).join("\n");

  assert.ok(nonBrandQuestions.length >= 5);
  assert.equal(brandQuestions.length, 1);
  assert.match(questions[0].text, /^Quelle entreprise de nettoyage/i);
  assert.match(combined, /Quelles entreprises de nettoyage/i);
  assert.doesNotMatch(
    combined,
    /professionnel de entreprise|projet de entreprise/i
  );
  assert.doesNotMatch(
    combined,
    /bureaux|vitres|fin de chantier|parties communes|industriel/i
  );
  questions.forEach((question) => {
    assert.equal(
      isQuestionRelevantForCompany(question.text, snep),
      true,
      question.text
    );
  });
});

test("limits deterministic brand questions to one in every reserve", () => {
  const restaurant = company("Restaurant", {
    name: "Le Mancel",
    description: "Déjeuner et dîner sur réservation.",
    services: ["Déjeuner", "Dîner"],
  });
  const cleaning = company("Entreprise de nettoyage", {
    name: "SNEP",
    location: "Ifs",
    serviceAreas: ["Ifs"],
  });

  [restaurant, cleaning].forEach((fixture) => {
    const brandQuestions = generateQuestionCandidates(fixture).filter(
      (question) => question.intent === "Marque"
    );
    assert.equal(brandQuestions.length, 1, fixture.category);
  });
});

test("does not invent a specific service when the enriched profile has none", () => {
  const unprofiledPlumber = company("Plombier");
  const questions = generateQuestionCandidates(unprofiledPlumber);
  const combined = questions.map((question) => question.text).join("\n");

  assert.ok(questions.length > 0);
  assert.match(combined, /plombier/i);
  assert.doesNotMatch(
    combined,
    /fuite|chauffe-eau|canalisation|salle de bain/i
  );
});
