"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RELIEF_PLANS, TRIAL_OFFER, type PlanCode } from "../lib/plans";

const demoViews = [
  {
    id: "observe",
    index: "01",
    label: "Réponse observée",
    title: "Retrouvez ce qui a réellement été répondu.",
    copy: "Chaque résultat conserve la question, l’assistant, la réponse complète, la date, les marques et les sources citées.",
  },
  {
    id: "compare",
    index: "02",
    label: "Écart concurrentiel",
    title: "Comprenez qui est recommandé à votre place.",
    copy: "Relief compare votre présence à celle des concurrents et vous ramène toujours aux réponses et aux sources qui composent l’écart.",
  },
  {
    id: "act",
    index: "03",
    label: "Priorité",
    title: "Sachez quelle action examiner en premier.",
    copy: "Relief transforme l’écart observé en piste à vérifier, reliée à la question, aux concurrents et aux sources concernées.",
  },
] as const;

// The variants are kept as an internal design aid without exposing prototype
// controls to visitors on the production landing page.
const SHOW_INTERFACE_VARIANTS = false;

const interfaceVariants = [
  { id: "editorial", label: "Éditorial", note: "Lecture guidée" },
  { id: "dashboard", label: "Tableau", note: "Vue compacte" },
  { id: "signal", label: "Signaux", note: "Cartes de décision" },
  { id: "report", label: "Rapport", note: "Présentation client" },
  { id: "mono", label: "Monochrome", note: "Focus contenu" },
  { id: "metric", label: "Analytique", note: "Lecture chiffrée" },
] as const;

const aiEngines = [
  {
    id: "openai",
    name: "ChatGPT",
    maker: "OpenAI",
    logo: "/ai-logos/openai.svg",
    color: "#10a37f",
    status: "disponible",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    maker: "Perplexity AI",
    logo: "/ai-logos/perplexity.svg",
    color: "#1fb8cd",
    status: "disponible",
  },
  {
    id: "gemini",
    name: "Gemini",
    maker: "Google",
    logo: "/ai-logos/gemini.svg",
    color: "#8e75ff",
    status: "disponible",
  },
  {
    id: "google",
    name: "Google",
    maker: "Google",
    logo: "/ai-logos/google.ico",
    color: "#4285f4",
    status: "disponible",
  },
  {
    id: "claude",
    name: "Claude",
    maker: "Anthropic",
    logo: "/ai-logos/claude.ico",
    color: "#d97757",
    status: "feuille de route",
  },
  {
    id: "mistral",
    name: "Mistral",
    maker: "Mistral AI",
    logo: "/ai-logos/mistral.svg",
    color: "#ff7000",
    status: "feuille de route",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    maker: "DeepSeek",
    logo: "/ai-logos/deepseek.svg",
    color: "#4d6bff",
    status: "feuille de route",
  },
] as const;

const profileCards = [
  {
    code: "solo",
    eyebrow: "Entreprise ou indépendant",
    title: "Suivez votre propre marque.",
    copy: "Comprenez où votre entreprise apparaît, qui est recommandé à sa place et quelles améliorations examiner en priorité.",
    result: "Résultat : une feuille de route plus claire",
  },
  {
    code: "consultant",
    eyebrow: "Consultant & commercial",
    title: "Appuyez vos rendez-vous sur des réponses vérifiables.",
    copy: "Montrez au client où il est cité, quels concurrents ressortent et pourquoi vous recommandez un premier chantier.",
    result: "Résultat : un audit concret à présenter",
  },
  {
    code: "agency",
    eyebrow: "Agence",
    title: "Standardisez le suivi d’un portefeuille clients.",
    copy: "Séparez les dossiers, harmonisez la méthode, travaillez à plusieurs et comparez les observations dans le temps.",
    result: "Résultat : une méthode commune à l’équipe",
  },
] as const;

/* const siteChapters = [
  { id: "top", label: "Introduction" },
  { id: "produit", label: "Audit" },
  { id: "demonstration", label: "Résultats" },
  { id: "methode", label: "Méthode" },
  { id: "fonctionnalites", label: "Fonctions" },
  { id: "confiance", label: "Confiance" },
  { id: "profils", label: "Usages" },
  { id: "offres", label: "Offres" },
  { id: "essai", label: "Essai" },
  { id: "faq", label: "FAQ" },
] as const; */

const faqs = [
  {
    question: "Pourquoi ne pas simplement poser les questions à ChatGPT moi-même ?",
    answer:
      "Une réponse isolée donne une impression. Relief conserve les formulations, les assistants, les dates et les passages, puis compare les marques et les sources dans un même protocole. Vous pouvez ainsi retrouver l’origine d’un résultat et refaire la mesure plus tard.",
  },
  {
    question: "Qu’est-ce qu’une mesure IA ?",
    answer:
      "Une mesure IA correspond à une question testée sur un moteur, lors d’un passage indépendant, dans un contexte pays et langue. Six questions testées une fois représentent donc six mesures. Les mêmes six questions testées trois fois pour vérifier leur stabilité représentent dix-huit mesures.",
  },
  {
    question: "Quels assistants IA sont disponibles ?",
    answer:
      "Le premier périmètre commercial couvre ChatGPT, Perplexity et Gemini. Les autres assistants affichés dans la feuille de route seront ajoutés progressivement et ne sont pas comptés comme disponibles avant leur activation réelle.",
  },
  {
    question: "Les réponses IA changent-elles dans le temps ?",
    answer:
      "Oui. Une réponse dépend notamment de la formulation, de la date et du service interrogé. Relief documente chaque passage et permet de répéter le même protocole afin de distinguer un signal récurrent d’une occurrence isolée.",
  },
  {
    question: "L’essai demande-t-il une carte bancaire ?",
    answer:
      "Non. L’essai dure 7 jours et inclut 60 mesures pour 2 entreprises. À son terme, les nouvelles mesures sont suspendues ; aucune offre n’est activée automatiquement.",
  },
  {
    question: "Puis-je remettre un rapport à mon client ?",
    answer:
      "Oui. Le rapport regroupe la méthode, les réponses observées, les concurrents présents, les sources et les pistes de travail dans un format que vous pouvez partager.",
  },
  {
    question: "Les connexions Google et le Content Studio sont-ils déjà inclus ?",
    answer:
      "Non. Le produit vendu aujourd’hui est l’audit de visibilité IA. Les connexions Search Console, Google Analytics, Google Business Profile et le Content Studio sont des extensions en préparation. Leur disponibilité et leur tarification seront annoncées séparément.",
  },
  {
    question: "Peut-on travailler à plusieurs dans un même compte ?",
    answer:
      "L’offre Agence comprend cinq accès utilisateurs. Les offres Marque et Consultant comprennent un accès. Les besoins supplémentaires, l’API et le SSO sont étudiés dans une configuration sur mesure.",
  },
  {
    question: "Mes données et celles de mes clients restent-elles privées ?",
    answer:
      "Chaque entreprise reste dans un dossier séparé. Les connexions externes seront facultatives, limitées aux données nécessaires et révocables. Aucun contenu ne sera publié automatiquement sans validation explicite.",
  },
  {
    question: "Relief promet-il une présence garantie dans les réponses IA ?",
    answer:
      "Non. Relief mesure ce qui est observable, distingue les résultats qui se répètent des résultats isolés et ne compte pas une erreur technique comme une absence. Aucun outil ne peut garantir une citation future.",
  },
  {
    question: "Que se passe-t-il si j’atteins mon quota ?",
    answer:
      "Les nouvelles mesures sont mises en pause. Aucun dépassement n’est facturé automatiquement : vous pouvez changer d’offre ou demander un volume sur mesure.",
  },
  {
    question: "Comment fonctionne l’abonnement ?",
    answer:
      "L’essai ne demande aucune carte et n’active rien automatiquement. Après l’essai, vous choisissez une offre depuis votre espace ; le paiement ne pourra démarrer qu’une fois la facturation en ligne activée et après votre confirmation explicite.",
  },
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function SignalField({
  paused,
  forceMotion = false,
}: {
  paused: boolean;
  forceMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (paused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !forceMotion;
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      phase: number;
    }> = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let animationFrame = 0;
    let isIntersecting = false;
    let pageVisible = !document.hidden;

    const canAnimate = () =>
      !reducedMotion && !paused && isIntersecting && pageVisible;

    const stopAnimation = () => {
      if (!animationFrame) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);

      if (nodes.length === 0) {
        const count = Math.max(42, Math.min(68, Math.round(width / 20)));
        for (let index = 0; index < count; index += 1) {
          let x = (index * 83.7) % width;
          let y = (index * 47.3 + (index % 4) * 72) % height;
          const orbitCenterY = height * 0.58;
          const isOverInstrument = () => {
            const normalizedX = (x - width * 0.5) / (width * 0.43);
            const normalizedY = (y - orbitCenterY) / (height * 0.27);
            return normalizedX * normalizedX + normalizedY * normalizedY < 1;
          };
          while (isOverInstrument()) {
            x = (x + width * 0.23) % width;
            y = (y + height * 0.19) % height;
          }
          nodes.push({
            x,
            y,
            vx: ((index % 5) - 2) * 0.055,
            vy: (((index * 3) % 5) - 2) * 0.045,
            size: 0.8 + (index % 4) * 0.42,
            phase: index * 0.71,
          });
        }
      }

      stopAnimation();
      draw();
    };

    const draw = () => {
      animationFrame = 0;
      const animating = canAnimate();
      context.clearRect(0, 0, width, height);
      if (animating) frame += 0.012;

      nodes.forEach((node) => {
        if (animating) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -20) node.x = width + 20;
          if (node.x > width + 20) node.x = -20;
          if (node.y < -20) node.y = height + 20;
          if (node.y > height + 20) node.y = -20;

        }
      });

      for (let first = 0; first < nodes.length; first += 1) {
        const node = nodes[first];
        for (let second = first + 1; second < nodes.length; second += 1) {
          const other = nodes[second];
          const distance = Math.hypot(node.x - other.x, node.y - other.y);
          if (distance > 145) continue;

          const strength = 1 - distance / 145;
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(66, 145, 255, ${strength * 0.16})`;
          context.lineWidth = 0.7;
          context.stroke();
        }

        const pulse = 0.72 + Math.sin(frame * 3 + node.phase) * 0.28;
        context.beginPath();
        context.arc(node.x, node.y, node.size + pulse, 0, Math.PI * 2);
        context.fillStyle =
          node.size > 1.6
            ? `rgba(117, 230, 255, ${0.46 + pulse * 0.2})`
            : `rgba(50, 129, 255, ${0.3 + pulse * 0.18})`;
        context.fill();
      }

      if (animating) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handleVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible && canAnimate()) {
        if (!animationFrame) {
          animationFrame = window.requestAnimationFrame(draw);
        }
      } else {
        stopAnimation();
      }
    };

    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            isIntersecting = entry.isIntersecting;
            if (canAnimate()) {
              if (!animationFrame) {
                animationFrame = window.requestAnimationFrame(draw);
              }
            } else {
              stopAnimation();
            }
          })
        : null;

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (intersectionObserver) {
      intersectionObserver.observe(canvas);
    } else {
      isIntersecting = true;
    }
    resize();
    if (canAnimate() && !animationFrame) {
      animationFrame = window.requestAnimationFrame(draw);
    }

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAnimation();
    };
  }, [forceMotion, paused]);

  return <canvas className="signal-field" ref={canvasRef} aria-hidden="true" />;
}

function HeroOrbitField({
  paused,
  forceMotion = false,
}: {
  paused: boolean;
  forceMotion?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (paused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const colors = [
      "86, 156, 255",
      "72, 222, 255",
      "154, 93, 255",
      "112, 126, 255",
    ] as const;
    const particles = Array.from({ length: 28 }, (_, index) => ({
      color: colors[index % colors.length],
      orbit: index % 3,
      phase:
        (index / 28) * Math.PI * 2 + (index % 3) * 0.39,
      size: 1.05 + (index % 5) * 0.38,
      speed:
        (index % 2 === 0 ? 1 : -1) *
        (0.000085 + (index % 6) * 0.000009),
      trail: 0.07 + (index % 4) * 0.025,
    }));

    let animationFrame = 0;
    let width = 1;
    let height = 1;
    let isIntersecting = false;
    let pageVisible = !document.hidden;
    let reducedMotion = motionPreference.matches && !forceMotion;

    const canAnimate = () =>
      !paused && !reducedMotion && isIntersecting && pageVisible;

    const stopAnimation = () => {
      if (!animationFrame) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const paint = (time = 0) => {
      animationFrame = 0;
      context.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const elapsed = reducedMotion ? 0 : time;

      context.save();
      context.globalCompositeOperation = "lighter";

      for (let orbit = 0; orbit < 3; orbit += 1) {
        const orbitCenterY = height * (0.5 - orbit * 0.015);
        const radiusX = width * (0.405 + orbit * 0.032);
        const radiusY = height * (0.17 + orbit * 0.028);
        const trackGradient = context.createLinearGradient(
          centerX - radiusX,
          orbitCenterY,
          centerX + radiusX,
          orbitCenterY,
        );
        trackGradient.addColorStop(0, "rgba(69, 96, 255, 0)");
        trackGradient.addColorStop(0.24, "rgba(63, 121, 255, 0.14)");
        trackGradient.addColorStop(0.52, "rgba(91, 193, 255, 0.18)");
        trackGradient.addColorStop(0.84, "rgba(133, 77, 255, 0.12)");
        trackGradient.addColorStop(1, "rgba(111, 83, 255, 0)");

        context.beginPath();
        context.ellipse(
          centerX,
          orbitCenterY,
          radiusX,
          radiusY,
          0,
          Math.PI * 0.92,
          Math.PI * 2.08,
        );
        context.strokeStyle = trackGradient;
        context.lineWidth = orbit === 1 ? 0.9 : 0.6;
        context.stroke();

        const scannerTravel =
          (elapsed * (0.00006 + orbit * 0.000007) + orbit * 0.79) %
          (Math.PI - 0.42);
        const scannerPhase = Math.PI + scannerTravel;
        const scannerGradient = context.createLinearGradient(
          centerX - radiusX,
          orbitCenterY - radiusY,
          centerX + radiusX,
          orbitCenterY + radiusY,
        );
        scannerGradient.addColorStop(0, "rgba(55, 102, 255, 0.08)");
        scannerGradient.addColorStop(0.48, "rgba(70, 214, 255, 0.68)");
        scannerGradient.addColorStop(1, "rgba(156, 70, 255, 0.12)");
        context.beginPath();
        context.ellipse(
          centerX,
          orbitCenterY,
          radiusX,
          radiusY,
          0,
          scannerPhase,
          scannerPhase + 0.18 + orbit * 0.018,
        );
        context.strokeStyle = scannerGradient;
        context.lineCap = "round";
        context.lineWidth = 0.95 + (orbit % 2) * 0.3;
        context.stroke();
      }

      particles
        .map((particle) => {
          const angle = particle.phase + elapsed * particle.speed;
          return {
            ...particle,
            angle,
            depth: (1 - Math.sin(angle)) / 2,
          };
        })
        .sort((first, second) => first.depth - second.depth)
        .forEach((particle) => {
          const orbitCenterY = height * (0.5 - particle.orbit * 0.015);
          const radiusX = width * (0.405 + particle.orbit * 0.032);
          const radiusY = height * (0.17 + particle.orbit * 0.028);
          const horizontalPosition = Math.abs(Math.cos(particle.angle));
          const lowerPosition = Math.sin(particle.angle);
          if (lowerPosition > 0.3 && horizontalPosition < 0.78) return;

          const x = centerX + Math.cos(particle.angle) * radiusX;
          const y = orbitCenterY + Math.sin(particle.angle) * radiusY;
          const trailAngle =
            particle.angle - Math.sign(particle.speed) * particle.trail;
          const trailX = centerX + Math.cos(trailAngle) * radiusX;
          const trailY = orbitCenterY + Math.sin(trailAngle) * radiusY;
          const alpha = 0.3 + particle.depth * 0.62;
          const radius = particle.size * (0.76 + particle.depth * 0.55);

          const trailGradient = context.createLinearGradient(
            trailX,
            trailY,
            x,
            y,
          );
          trailGradient.addColorStop(
            0,
            `rgba(${particle.color}, 0)`,
          );
          trailGradient.addColorStop(
            1,
            `rgba(${particle.color}, ${alpha * 0.72})`,
          );
          context.beginPath();
          context.moveTo(trailX, trailY);
          context.lineTo(x, y);
          context.strokeStyle = trailGradient;
          context.lineWidth = Math.max(0.6, radius * 0.72);
          context.stroke();

          const glow = context.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            radius * 5.4,
          );
          glow.addColorStop(0, `rgba(238, 249, 255, ${alpha})`);
          glow.addColorStop(
            0.18,
            `rgba(${particle.color}, ${alpha * 0.92})`,
          );
          glow.addColorStop(
            0.52,
            `rgba(${particle.color}, ${alpha * 0.22})`,
          );
          glow.addColorStop(1, `rgba(${particle.color}, 0)`);
          context.beginPath();
          context.arc(x, y, radius * 5.4, 0, Math.PI * 2);
          context.fillStyle = glow;
          context.fill();

          context.beginPath();
          context.arc(x, y, Math.max(0.65, radius * 0.72), 0, Math.PI * 2);
          context.fillStyle = `rgba(240, 249, 255, ${alpha})`;
          context.fill();
        });
      context.restore();

      if (canAnimate()) {
        animationFrame = window.requestAnimationFrame(paint);
      }
    };

    const restartAnimation = () => {
      stopAnimation();
      paint(window.performance.now());
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      restartAnimation();
    };

    const handleVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible) {
        restartAnimation();
      } else {
        stopAnimation();
      }
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches && !forceMotion;
      restartAnimation();
    };

    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              isIntersecting = entry.isIntersecting;
              if (isIntersecting) {
                restartAnimation();
              } else {
                stopAnimation();
              }
            },
            { threshold: 0.05 },
          )
        : null;
    const resizeObserver = new ResizeObserver(resize);

    resizeObserver.observe(canvas);
    intersectionObserver?.observe(canvas);
    if (!intersectionObserver) isIntersecting = true;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionPreference);
    resize();

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionPreference);
      stopAnimation();
    };
  }, [forceMotion, paused]);

  return (
    <canvas
      className="hero-orbit-particles"
      ref={canvasRef}
      aria-hidden="true"
    />
  );
}

export function CommercialSite() {
  const [annual, setAnnual] = useState(false);
  const [demoView, setDemoView] =
    useState<(typeof demoViews)[number]["id"]>("observe");
  const [demoAuto, setDemoAuto] = useState(true);
  const [interfaceVariant, setInterfaceVariant] =
    useState<(typeof interfaceVariants)[number]["id"]>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMobileCta, setShowMobileCta] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null);
  const [formState, setFormState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [formMessage, setFormMessage] = useState("");
  const [enableDecor, setEnableDecor] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileMenuLinkRef = useRef<HTMLAnchorElement>(null);
  const demoTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeDemo = useMemo(
    () => demoViews.find((view) => view.id === demoView) ?? demoViews[0],
    [demoView],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEnableDecor(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectedPlanDetails =
    RELIEF_PLANS.find((plan) => plan.code === selectedPlan) ??
    RELIEF_PLANS[0];
  const selectedPlanName = selectedPlan ? selectedPlanDetails.name : null;

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTrialOpen(false);
        if (mobileMenu) {
          setMobileMenu(false);
          window.requestAnimationFrame(() => {
            mobileMenuButtonRef.current?.focus();
          });
        }
      }
    }

    window.addEventListener("keydown", handleEscape);
    document.body.classList.toggle("modal-open", trialOpen);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("modal-open");
    };
  }, [mobileMenu, trialOpen]);

  useEffect(() => {
    if (!trialOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    modal.focus();

    function keepFocusInside(event: KeyboardEvent) {
      if (event.key !== "Tab" || !modal) return;

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getAttribute("aria-hidden") !== "true");

      if (focusable.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!(active instanceof Node) || !modal.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && (active === first || active === modal)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", keepFocusInside);
    return () => {
      window.removeEventListener("keydown", keepFocusInside);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [trialOpen]);

  useEffect(() => {
    if (formState === "success") {
      successHeadingRef.current?.focus();
    }
  }, [formState]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !("IntersectionObserver" in window)) return;

    const finalCta = rootRef.current?.querySelector<HTMLElement>(".final-cta");
    let heroVisible = true;
    let finalCtaVisible = false;
    const updateMobileCta = () =>
      setShowMobileCta(!heroVisible && !finalCtaVisible);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) {
            heroVisible = entry.isIntersecting;
          } else if (entry.target === finalCta) {
            finalCtaVisible = entry.isIntersecting;
          }
        });
        updateMobileCta();
      },
      { threshold: 0.08 },
    );
    observer.observe(hero);
    if (finalCta) observer.observe(finalCta);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!demoAuto || !enableDecor) return;

    const demoTimer = window.setInterval(() => {
      if (
        document.hidden ||
        !rootRef.current
          ?.querySelector(".demo-section")
          ?.classList.contains("is-section-in-view")
      ) {
        return;
      }
      setDemoView((current) => {
        const currentIndex = demoViews.findIndex((view) => view.id === current);
        return demoViews[(currentIndex + 1) % demoViews.length].id;
      });
    }, 6200);

    return () => window.clearInterval(demoTimer);
  }, [demoAuto, enableDecor]);

  useEffect(() => {
    if (!enableDecor) return;

    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const targets = root.querySelectorAll<HTMLElement>(
      [
        ".evidence-strip > div",
        ".section-heading",
        ".problem-grid > article",
        ".demo-tabs > button",
        ".product-window",
        ".method-steps > article",
        ".bento-grid > article",
        ".evolution-heading",
        ".evolution-grid > article",
        ".signal-bridge",
        ".profile-grid > article",
        ".pricing-grid > article",
        ".enterprise-band",
        ".trust-copy",
        ".trust-console",
        ".trial-timeline > article",
        ".faq-list > details",
        ".final-cta .section-shell",
      ].join(","),
    );

    targets.forEach((target) => {
      const siblings = target.parentElement
        ? Array.from(target.parentElement.children)
        : [];
      const siblingIndex = Math.max(0, siblings.indexOf(target));
      target.dataset.reveal = "";
      target.style.setProperty(
        "--reveal-delay",
        `${Math.min(siblingIndex % 4, 3) * 90}ms`,
      );
    });

    root.classList.add("motion-ready");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [enableDecor]);

  useEffect(() => {
    if (!enableDecor) return;

    const root = rootRef.current;
    const progress = progressRef.current;
    if (!root || !progress) return;

    const header = root.querySelector<HTMLElement>(".site-header");
    const motionSections = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          ".hero",
          ".engine-marquee",
          ".problem-section",
          ".demo-section",
          ".method-section",
          ".features-section",
          ".evolution-section",
          ".trust-section",
          ".profiles-section",
          ".pricing-section",
          ".trial-section",
          ".faq-section",
          ".final-cta",
        ].join(","),
      ),
    );
    const chapterSections = Array.from(
      root.querySelectorAll<HTMLElement>("main > section[id]"),
    );
    const navigationLinks = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(
        '.nav-links a[href^="#"], [data-chapter-link]',
      ),
    );
    const spotlightCards = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          ".problem-grid article",
          ".product-window",
          ".method-steps article",
          ".bento-card",
          ".evolution-grid article",
          ".signal-bridge",
          ".trust-console",
          ".profile-grid article",
          ".price-card",
          ".enterprise-band",
          ".trial-timeline article",
          ".faq-list details",
        ].join(","),
      ),
    );
    let scrollFrame = 0;
    let spotlightFrame = 0;
    let spotlightTarget: HTMLElement | null = null;
    let spotlightX = 0;
    let spotlightY = 0;
    let activeChapter = "";

    motionSections.forEach((section, index) => {
      section.dataset.motionSection = "";
      section.style.setProperty("--section-order", `${index + 1}`);
    });
    spotlightCards.forEach((card) => {
      card.dataset.spotlight = "";
    });

    const setActiveChapter = (id: string) => {
      if (id === activeChapter) return;
      activeChapter = id;
      root.dataset.activeChapter = id;

      navigationLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const updateProgress = () => {
      scrollFrame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = Math.min(
        1,
        Math.max(0, scrollable > 0 ? window.scrollY / scrollable : 0),
      );
      const viewportHeight = window.innerHeight;
      const readingLine = viewportHeight * 0.42;

      progress.style.transform = `scaleX(${ratio})`;
      root.style.setProperty("--page-progress", `${ratio}`);
      header?.classList.toggle("is-scrolled", window.scrollY > 18);

      let currentSection = chapterSections[0];
      chapterSections.forEach((section) => {
        const bounds = section.getBoundingClientRect();
        if (bounds.top <= readingLine) currentSection = section;
      });
      if (currentSection?.id) setActiveChapter(currentSection.id);

      motionSections.forEach((section) => {
        const bounds = section.getBoundingClientRect();
        const sectionProgress = Math.min(
          1,
          Math.max(
            0,
            (viewportHeight - bounds.top) / (viewportHeight + bounds.height),
          ),
        );
        const sectionOffset = (0.5 - sectionProgress) * 34;
        section.style.setProperty(
          "--section-progress",
          sectionProgress.toFixed(3),
        );
        section.style.setProperty(
          "--section-offset",
          `${sectionOffset.toFixed(2)}px`,
        );
      });
    };

    const requestProgress = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateProgress);
    };

    const updateSpotlight = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const card = event.target.closest<HTMLElement>("[data-spotlight]");
      if (!card || !root.contains(card)) return;

      spotlightTarget = card;
      spotlightX = event.clientX;
      spotlightY = event.clientY;
      if (spotlightFrame) return;

      spotlightFrame = window.requestAnimationFrame(() => {
        spotlightFrame = 0;
        if (!spotlightTarget) return;
        const bounds = spotlightTarget.getBoundingClientRect();
        spotlightTarget.style.setProperty(
          "--spot-x",
          `${spotlightX - bounds.left}px`,
        );
        spotlightTarget.style.setProperty(
          "--spot-y",
          `${spotlightY - bounds.top}px`,
        );
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            "is-section-in-view",
            entry.isIntersecting,
          );
        });
      },
      { rootMargin: "8% 0px 8% 0px", threshold: 0.08 },
    );
    motionSections.forEach((section) => sectionObserver.observe(section));

    window.addEventListener("scroll", requestProgress, { passive: true });
    window.addEventListener("resize", requestProgress, { passive: true });
    root.addEventListener("toggle", requestProgress, true);
    updateProgress();

    if (window.matchMedia("(pointer: fine)").matches) {
      root.addEventListener("pointermove", updateSpotlight, { passive: true });
    }

    const sizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(requestProgress)
        : null;
    sizeObserver?.observe(root);

    return () => {
      window.removeEventListener("scroll", requestProgress);
      window.removeEventListener("resize", requestProgress);
      root.removeEventListener("toggle", requestProgress, true);
      root.removeEventListener("pointermove", updateSpotlight);
      sectionObserver.disconnect();
      sizeObserver?.disconnect();
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (spotlightFrame) window.cancelAnimationFrame(spotlightFrame);
    };
  }, [enableDecor]);

  function handleMobileMenuToggle() {
    const nextOpen = !mobileMenu;
    setMobileMenu(nextOpen);
    if (nextOpen) {
      window.requestAnimationFrame(() => {
        firstMobileMenuLinkRef.current?.focus();
      });
    }
  }

  function handleDemoTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % demoViews.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + demoViews.length) % demoViews.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = demoViews.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    const nextView = demoViews[nextIndex];
    setDemoAuto(false);
    setDemoView(nextView.id);
    demoTabRefs.current[nextIndex]?.focus();
  }

  function openTrial(plan?: PlanCode) {
    window.location.assign(`/inscription?plan=${plan ?? "consultant"}`);
    return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelectedPlan(plan ?? null);
    setFormState("idle");
    setFormMessage("");
    setTrialOpen(true);
    setMobileMenu(false);
  }

  async function submitTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("submitting");
    setFormMessage("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Impossible de lancer l’essai.");
      }

      setFormState("success");
      setFormMessage(
        result.message ??
          "Votre essai est prêt. Connectez-vous avec la même adresse pour l’activer.",
      );
    } catch (error) {
      setFormState("error");
      setFormMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Le service met trop de temps à répondre. Réessayez."
          : error instanceof Error
            ? error.message
            : "Une erreur est survenue. Réessayez dans un instant.",
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
      <div
      className={enableDecor ? "commercial-site motion-forced" : "commercial-site"}
      ref={rootRef}
    >
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <div className="scroll-progress" aria-hidden="true">
        <i ref={progressRef} />
      </div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Relief Visibility OS">
          <Image
            src="/relief-visibility-os-lockup-on-dark.png"
            alt="Relief Visibility OS"
            width={994}
            height={369}
            priority
            unoptimized
          />
        </a>

        <nav
          className={mobileMenu ? "nav-links is-open" : "nav-links"}
          id="site-navigation"
        >
          <a
            href="#produit"
            onClick={() => setMobileMenu(false)}
            ref={firstMobileMenuLinkRef}
          >
            Audit IA
          </a>
          <a href="#demonstration" onClick={() => setMobileMenu(false)}>
            Exemple d’audit
          </a>
          <a href="#evolution" onClick={() => setMobileMenu(false)}>
            Données Google
          </a>
          <a href="#offres" onClick={() => setMobileMenu(false)}>
            Tarifs
          </a>
          <a href="#faq" onClick={() => setMobileMenu(false)}>
            FAQ
          </a>
        </nav>

        <div className="header-actions">
          <a className="login-link" href="/espace">
            Se connecter
          </a>
          <button className="button button-small" onClick={() => openTrial()}>
            Analyser ma marque
          </button>
          <button
            className="menu-button"
            type="button"
            ref={mobileMenuButtonRef}
            aria-label={mobileMenu ? "Fermer le menu" : "Ouvrir le menu"}
            aria-controls="site-navigation"
            aria-expanded={mobileMenu}
            onClick={handleMobileMenuToggle}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" id="top" ref={heroRef}>
          <SignalField paused={!enableDecor} />
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-horizon" aria-hidden="true" />
          <div className="hero-system-status" aria-hidden="true">
            <span>
              <i />
              Audit IA documenté
            </span>
            <span>3 assistants analysés</span>
            <span>réponses et sources conservées</span>
          </div>
          <div className="hero-content">
            <div className="hero-copy">
              <span className="hero-eyebrow">Audit de visibilité dans les réponses IA</span>
              <h1>Découvrez si les IA recommandent votre entreprise… ou vos concurrents.</h1>
              <p>
                Relief teste les questions que posent vos prospects sur ChatGPT,
                Perplexity et Gemini. Vous voyez les réponses obtenues, les
                marques et les sources citées, puis les actions à examiner en priorité.
              </p>
              <div className="hero-actions">
                <button className="button button-hero" onClick={() => openTrial()}>
                  <span>Analyser ma marque</span>
                  <b aria-hidden="true">→</b>
                </button>
                <a className="button button-ghost" href="#demonstration">
                  Voir un audit d’exemple
                </a>
              </div>
              <p className="hero-proofline">
                Premier diagnostic guidé <i /> Aucune carte demandée <i /> Données privées
              </p>
            </div>

            <div
              className="hero-orbit-visual"
              role="img"
              aria-label="Instrument orbital de mesure de la visibilité dans les assistants IA"
            >
              <span className="hero-orbit-media" aria-hidden="true">
                <Image
                  className="hero-orbit-image"
                  src="/hero-visibility-orbit.webp"
                  alt=""
                  width={1717}
                  height={916}
                  priority
                  unoptimized
                />
                <HeroOrbitField paused={!enableDecor} />
              </span>
            </div>
          </div>
        </section>

        <section className="engine-marquee" aria-label="Moteurs IA suivis par Relief">
          <div className="engine-marquee-window">
            <div className="engine-marquee-track" role="list">
              {Array.from({ length: 4 }, () => aiEngines)
                .flat()
                .map((engine, index) => (
                <article
                  aria-hidden={index >= aiEngines.length ? true : undefined}
                  key={`${engine.name}-${index}`}
                  role="listitem"
                  style={{ "--engine-color": engine.color } as CSSProperties}
                >
                  <div>
                    <Image
                      className={`engine-logo engine-logo-${engine.id}`}
                      src={engine.logo}
                      alt=""
                      width={42}
                      height={42}
                      unoptimized
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="problem-section section-shell" id="produit">
          <div className="section-heading split-heading">
            <div>
              <span className="section-index">Ce que Relief vous apprend</span>
              <h2>Quand un prospect demande une recommandation à une IA, savez-vous qui elle cite&nbsp;?</h2>
            </div>
            <p>
              Relief ne se contente pas d’un score. Il conserve les réponses et
              vous montre précisément où votre marque apparaît, qui prend sa place
              et quels éléments examiner ensuite.
            </p>
          </div>

          <div className="clarity-checklist" aria-label="Questions auxquelles répond un audit Relief">
            <span>Votre marque est-elle citée&nbsp;?</span>
            <span>Quels concurrents apparaissent&nbsp;?</span>
            <span>Sur quelles questions&nbsp;?</span>
            <span>Quelles sources sont mentionnées&nbsp;?</span>
            <span>Quelle action vérifier en premier&nbsp;?</span>
          </div>

          <div className="problem-grid">
            <article className="problem-main">
              <span className="card-kicker">Exemple · données illustratives</span>
              <blockquote>
                « Quel prestataire choisir pour répondre à ce besoin dans ma région&nbsp;? »
              </blockquote>
              <div className="answer-flow">
                <span className="flow-label">Dans six passages comparables</span>
                <div>
                  <span className="answer-rank">1</span>
                  <strong>Concurrent A</strong>
                  <small>présent dans 5 réponses sur 6</small>
                </div>
                <div>
                  <span className="answer-rank">2</span>
                  <strong>Concurrent B</strong>
                  <small>présent dans 4 réponses sur 6</small>
                </div>
                <div className="is-missing">
                  <span className="answer-rank">—</span>
                  <strong>Votre entreprise</strong>
                  <small>présente dans 2 réponses sur 6</small>
                </div>
              </div>
            </article>

            <article className="problem-side signal-card">
              <span className="card-kicker">Ce que montre l’audit</span>
              <strong>Votre marque apparaît dans 2 passages sur 6</strong>
              <div className="signal-meter">
                <i />
              </div>
              <p>
                Le concurrent A apparaît dans 5 passages. Chaque réponse reste
                consultable pour vérifier cet écart.
              </p>
            </article>

            <article className="problem-side action-card">
              <span className="card-kicker">La première piste proposée</span>
              <span className="priority-number">01</span>
              <strong>Comparer les pages et les preuves citées dans les réponses.</strong>
              <p>
                Vous décidez ensuite de l’amélioration à tester avant de relancer
                le même protocole.
              </p>
            </article>
          </div>
        </section>

        <section className="demo-section" id="demonstration">
          <div className="section-shell">
            <div className="section-heading demo-heading">
              <span className="section-index light">Un audit de bout en bout</span>
              <h2>Une vraie question devient une décision documentée.</h2>
              <p>
                Relief sépare la réponse observée, l’écart concurrentiel et la
                priorité à vérifier. Vous savez toujours d’où vient chaque conclusion.
              </p>
            </div>

            <div className="demo-layout">
              <div
                className="demo-tabs"
                role="tablist"
                aria-label="Démonstration Relief"
              >
                {demoViews.map((view, index) => (
                  <button
                    key={view.id}
                    id={`demo-tab-${view.id}`}
                    type="button"
                    role="tab"
                    aria-selected={demoView === view.id}
                    aria-controls="demo-panel"
                    tabIndex={demoView === view.id ? 0 : -1}
                    ref={(node) => {
                      demoTabRefs.current[index] = node;
                    }}
                    className={[
                      demoView === view.id ? "is-active" : "",
                      demoAuto ? "is-auto" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onFocus={() => setDemoAuto(false)}
                    onKeyDown={(event) => handleDemoTabKeyDown(event, index)}
                    onClick={() => {
                      setDemoView(view.id);
                      setDemoAuto(false);
                    }}
                  >
                    <span>{view.index}</span>
                    <div>
                      <strong>{view.label}</strong>
                      <small>{view.title}</small>
                    </div>
                  </button>
                ))}
              </div>

              {SHOW_INTERFACE_VARIANTS && <div className="interface-variants" aria-label="Six directions d’interface">
                {interfaceVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={interfaceVariant === variant.id ? "is-active" : ""}
                    onClick={() => setInterfaceVariant(variant.id)}
                  >
                    <strong>{variant.label}</strong>
                    <small>{variant.note}</small>
                  </button>
                ))}
              </div>}

              <div
                className={`product-window interface-${interfaceVariant}`}
                id="demo-panel"
                role="tabpanel"
                aria-labelledby={`demo-tab-${demoView}`}
                tabIndex={0}
                onFocus={() => setDemoAuto(false)}
              >
                <div className="window-bar">
                  <span>Relief / Audit de démonstration</span>
                  <div>
                    <i />
                    audit d’exemple · mesure terminée
                  </div>
                </div>
                <div className="window-body">
                  <div className="window-sidebar">
                    <b>R</b>
                    <span className="is-active" />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="window-content">
                    <span className="preview-label">Démonstration · données illustratives</span>
                    <h3>{activeDemo.title}</h3>
                    <p>{activeDemo.copy}</p>

                    {demoView === "observe" && (
                      <div className="observe-panel">
                        <div className="question-chip">
                          Quel prestataire choisir pour répondre à ce besoin dans ma région&nbsp;?
                        </div>
                        <div className="engine-results">
                          <article>
                            <Image src="/ai-logos/openai.svg" alt="" width={28} height={28} unoptimized />
                            <strong>Présent</strong>
                            <small>citée dans cette réponse</small>
                          </article>
                          <article>
                            <Image src="/ai-logos/perplexity.svg" alt="" width={28} height={28} unoptimized />
                            <strong>Absent</strong>
                            <small>3 concurrents cités</small>
                          </article>
                          <article>
                            <Image src="/ai-logos/gemini.svg" alt="" width={28} height={28} unoptimized />
                            <strong>Présent</strong>
                            <small>mention sans lien</small>
                          </article>
                        </div>
                      </div>
                    )}

                    {demoView === "compare" && (
                      <div className="compare-panel">
                        <div className="leader-row your-brand">
                          <span>Votre marque</span>
                          <div><i style={{ width: "34%" }} /></div>
                          <strong>2 / 6</strong>
                        </div>
                        <div className="leader-row">
                          <span>Concurrent A</span>
                          <div><i style={{ width: "84%" }} /></div>
                          <strong>5 / 6</strong>
                        </div>
                        <div className="leader-row">
                          <span>Concurrent B</span>
                          <div><i style={{ width: "66%" }} /></div>
                          <strong>4 / 6</strong>
                        </div>
                        <div className="comparison-note">
                          <span>Point à examiner</span>
                          <p>
                            Le concurrent A est davantage cité dans cet exemple.
                            Les sources présentes dans les réponses permettent
                            d’en chercher la raison.
                          </p>
                        </div>
                      </div>
                    )}

                    {demoView === "act" && (
                      <div className="action-preview">
                        <div className="action-topline">
                          <span>Piste à vérifier</span>
                          <small>À confirmer avec les sources</small>
                        </div>
                        <strong>
                          Créer une page de preuve répondant précisément à la
                          question prioritaire.
                        </strong>
                        <ul>
                          <li>Réponse claire en ouverture</li>
                          <li>Zone, service et public explicités</li>
                          <li>Deux preuves vérifiables ajoutées</li>
                        </ul>
                        <span className="action-brief-link">
                          Aperçu du brief d’action
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="method-section section-shell" id="methode">
          <div className="section-heading split-heading">
            <div>
              <span className="section-index">Comment ça marche</span>
              <h2>De votre marché à une priorité vérifiable, en quatre étapes.</h2>
            </div>
            <p>
              Vous définissez le contexte. Relief organise les passages, rassemble
              les réponses et vous aide à lire les écarts sans masquer les preuves.
            </p>
          </div>

          <div className="method-steps">
            <article>
              <span>01</span>
              <div className="step-orbit">
                <i />
                <b>Périmètre</b>
              </div>
              <h3>Décrivez la marque et son marché</h3>
              <p>
                Indiquez l’activité, les offres, la zone et les principaux
                concurrents afin de cadrer l’audit.
              </p>
            </article>
            <article>
              <span>02</span>
              <div className="step-orbit">
                <i />
                <b>Questions</b>
              </div>
              <h3>Préparez les questions des prospects</h3>
              <p>
                Choisissez des questions de découverte, de comparaison ou de
                recherche locale proches d’un besoin réel.
              </p>
            </article>
            <article>
              <span>03</span>
              <div className="step-orbit">
                <i />
                <b>Résultats</b>
              </div>
              <h3>Analysez les réponses réunies</h3>
              <p>
                Relief regroupe l’assistant, la réponse, les marques, les sources,
                la date et le passage correspondant.
              </p>
            </article>
            <article>
              <span>04</span>
              <div className="step-orbit">
                <i />
                <b>Priorités</b>
              </div>
              <h3>Choisissez l’action à vérifier</h3>
              <p>
                Reliez chaque piste à l’écart observé, appliquez l’amélioration
                retenue puis refaites le même test.
              </p>
            </article>
          </div>
        </section>

        <section
          className="features-section section-shell"
          id="fonctionnalites"
        >
          <div className="section-heading">
            <span className="section-index">Le cœur de Relief</span>
            <h2>Tout ce qu’il faut pour comprendre, suivre et partager un audit IA.</h2>
          </div>

          <div className="bento-grid">
            <article className="bento-card bento-wide bento-dark">
              <div>
                <span className="card-kicker">Présence et concurrence</span>
                <h3>Voyez qui apparaît, sur quelles questions et à quelle fréquence.</h3>
                <p>
                  Comparez votre marque aux concurrents tout en gardant accès aux
                  réponses complètes et aux sources mentionnées.
                </p>
              </div>
              <div className="mini-faceoff">
                <span>Votre marque</span>
                <div><i style={{ width: "38%" }} /></div>
                <span>Leader observé</span>
                <div><i style={{ width: "81%" }} /></div>
              </div>
            </article>

            <article className="bento-card bento-tall">
              <span className="card-kicker">Dossiers distincts</span>
              <h3>Conservez un périmètre propre à chaque marque ou client.</h3>
              <div className="question-stack">
                <span>Dossier A</span>
                <p>Questions, concurrents et résultats propres</p>
                <span>Dossier B</span>
                <p>Historique et rapport indépendants</p>
                <span>Portefeuille</span>
                <p>Une structure commune à tous les dossiers</p>
              </div>
            </article>

            <article className="bento-card">
              <span className="card-kicker">Rapport partageable</span>
              <h3>Présentez la méthode, les preuves et les priorités retenues.</h3>
              <p>
                Le rapport réunit les réponses observées, les écarts et les
                pistes de travail dans un format lisible.
              </p>
              <div className="document-preview">
                <i />
                <i />
                <i />
                <b>RAPPORT</b>
              </div>
            </article>

            <article className="bento-card">
              <span className="card-kicker">Historique et nouveau passage</span>
              <h3>Mesurez ce qui évolue après vos améliorations.</h3>
              <p>
                Relancez les mêmes questions après vos modifications pour voir
                ce qui change et ce qui reste stable.
              </p>
              <div className="trend-preview">
                <span>J0</span><i /><i /><b>J+21</b>
              </div>
            </article>
          </div>
        </section>

        <section className="evolution-section" id="evolution">
          <div className="section-shell">
            <div className="evolution-heading">
              <div>
                <span className="section-index light">Évolution de la plateforme</span>
                <span className="roadmap-badge">En préparation · non inclus actuellement</span>
                <h2>Relier demain les signaux IA, Google et les contenus à produire.</h2>
              </div>
              <p>
                Le cœur vendu aujourd’hui reste l’audit de visibilité IA. Ces
                connexions optionnelles enrichiront ensuite les recommandations
                avec vos propres données, sans remplacer la mesure principale.
              </p>
            </div>

            <div className="evolution-grid">
              <article>
                <span>01 · Données de recherche</span>
                <h3>Google Search Console et Analytics</h3>
                <p>
                  Repérer les requêtes, pages, impressions, clics et conversions
                  qui révèlent une opportunité à rapprocher de l’audit IA.
                </p>
                <small>Connexion facultative et révocable</small>
              </article>
              <article>
                <span>02 · Visibilité locale</span>
                <h3>Google Business Profile</h3>
                <p>
                  Lire les recherches locales, appels, clics et itinéraires, puis
                  préparer des publications adaptées à la fiche établissement.
                </p>
                <small>Accès limité aux données nécessaires</small>
              </article>
              <article>
                <span>03 · Passage à l’action</span>
                <h3>Content Studio</h3>
                <p>
                  Transformer une opportunité mesurée en brief, article, FAQ ou
                  post Google prêt à être relu avant publication.
                </p>
                <small>Aucune publication sans validation humaine</small>
              </article>
            </div>

            <div className="signal-bridge">
              <span>La logique Relief</span>
              <strong>Observation IA</strong><i>→</i>
              <strong>Données Google</strong><i>→</i>
              <strong>Priorité commune</strong><i>→</i>
              <strong>Contenu à valider</strong>
            </div>
          </div>
        </section>

        <section
          className="trust-section"
          id="confiance"
          aria-label="Méthodologie de confiance"
        >
          <div className="section-shell trust-layout">
            <div className="trust-copy">
              <span className="section-index light">
                Mesurer sans surpromettre
              </span>
              <h2>
                Chaque conclusion reste reliée aux réponses qui la composent.
              </h2>
              <p>
                Relief conserve la question, l’assistant, la réponse, la date et
                le passage. Une citation observée n’est pas une garantie future,
                et une source mentionnée reste un indice à examiner, pas une cause certaine.
              </p>
              <a href="/methodologie">Lire la méthodologie complète →</a>
            </div>
            <div className="trust-console">
              <div>
                <span>Test rapide</span>
                <strong>6 questions × 1 passage</strong>
                <small>Première lecture</small>
              </div>
              <div className="is-recommended">
                <span>Test répété</span>
                <strong>6 questions × 3 passages</strong>
                <small>Pour vérifier la stabilité</small>
              </div>
              <div className="confidence-line">
                <span>Réponse stable</span>
                <div><i /></div>
                <b>3/3</b>
              </div>
            </div>
          </div>
        </section>

        <section className="profiles-section" id="profils">
          <div className="section-shell">
            <div className="section-heading demo-heading">
              <span className="section-index light">À qui sert Relief</span>
              <h2>Trois façons d’utiliser la même mesure.</h2>
            </div>
            <div className="profile-grid">
              {profileCards.map((profile, index) => (
                <article key={profile.code}>
                  <span className="profile-index">0{index + 1}</span>
                  <small>{profile.eyebrow}</small>
                  <h3>{profile.title}</h3>
                  <p>{profile.copy}</p>
                  <strong>{profile.result}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pricing-section section-shell" id="offres">
          <div className="pricing-heading">
            <div className="section-heading">
              <span className="section-index">Tarifs</span>
              <h2>Choisissez selon le nombre de marques et votre rythme de suivi.</h2>
              <p>
                Une mesure correspond à une question testée sur un assistant,
                lors d’un passage. Dix questions testées sur trois assistants et
                répétées deux fois représentent 60 mesures.
              </p>
            </div>
            <div className="billing-toggle" aria-label="Période de facturation">
              <button
                className={!annual ? "is-active" : ""}
                aria-pressed={!annual}
                onClick={() => setAnnual(false)}
              >
                Mensuel
              </button>
              <button
                className={annual ? "is-active" : ""}
                aria-pressed={annual}
                onClick={() => setAnnual(true)}
              >
                Annuel <span>2 mois offerts</span>
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {RELIEF_PLANS.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <article
                  key={plan.code}
                  className={plan.popular ? "price-card is-popular" : "price-card"}
                >
                  {plan.popular && <span className="popular-badge">Recommandé</span>}
                  <div className="plan-head">
                    <span>{plan.name}</span>
                    <small>{plan.description}</small>
                  </div>
                  <div className="plan-price">
                    <strong key={`${plan.code}-${annual}`}>
                      {formatPrice(price)} €
                    </strong>
                    <span>HT / mois</span>
                  </div>
                  <p className="plan-billing">
                    {annual
                      ? `Facturé ${formatNumber(plan.annualTotal)} € HT par an`
                      : "Sans engagement · résiliable à tout moment"}
                  </p>
                  <div className="plan-capacity">
                    <strong>{formatNumber(plan.measures)}</strong>
                    <span>mesures IA incluses / mois</span>
                  </div>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <i aria-hidden="true">✓</i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={plan.popular ? "button" : "button button-outline"}
                    onClick={() => openTrial(plan.code)}
                  >
                    Commencer avec {plan.name}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="enterprise-band">
            <div>
              <span>Besoin de plus de volume ?</span>
              <strong>Offre sur mesure</strong>
              <p>
                Pour des volumes supérieurs, davantage d’utilisateurs ou un grand
                portefeuille. L’API et le SSO sont étudiés au cas par cas.
              </p>
            </div>
            <button
              className="button button-outline"
              onClick={() => openTrial("agency")}
              type="button"
            >
              Nous parler de votre besoin
            </button>
          </div>

          <p className="pricing-note">
            Tarifs de lancement, hors taxes. Le quota affiché est inclus dans
            l’offre ; aucune mesure supplémentaire n’est facturée sans votre
            accord. Les modules Google et Content Studio sont en préparation et
            ne sont pas inclus dans les tarifs affichés.
          </p>
        </section>

        <section className="trial-section section-shell" id="essai">
          <div className="section-heading split-heading">
            <div>
              <span className="section-index">Tester avant de souscrire</span>
              <h2>Obtenez une première lecture avant de choisir une offre.</h2>
            </div>
            <p>
              Créez votre espace, ajoutez une marque et lancez un audit guidé à
              partir des questions que vos prospects posent déjà.
            </p>
          </div>
          <div className="trial-timeline">
            <article>
              <span>Périmètre</span>
              <strong>Ajoutez votre premier cas réel</strong>
              <p>
                Décrivez la marque, son marché, sa zone et ses principaux concurrents.
              </p>
            </article>
            <article>
              <span>Volume</span>
              <strong>60 mesures incluses</strong>
              <p>De quoi tester 10 questions sur 3 assistants avec 2 passages.</p>
            </article>
            <article>
              <span>Fonctions</span>
              <strong>Une lecture de bout en bout</strong>
              <p>Consultez les réponses, les concurrents, les sources et les priorités.</p>
            </article>
            <article>
              <span>Fin de l’essai</span>
              <strong>Aucun abonnement automatique</strong>
              <p>
                Aucune carte n’est demandée. Vous choisissez ensuite de continuer
                ou non.
              </p>
            </article>
          </div>
        </section>

        <section className="faq-section section-shell" id="faq">
          <div className="section-heading">
            <span className="section-index">Questions fréquentes</span>
            <h2>Les réponses utiles avant votre premier audit.</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div className="final-grid" aria-hidden="true" />
          <div className="final-orbit orbit-a" />
          <div className="final-orbit orbit-b" />
          <div className="section-shell">
            <span className="eyebrow">
              <i />
              Commencez par une question que vos prospects posent déjà
            </span>
            <h2>
              Découvrez si les IA recommandent votre marque, vos concurrents ou
              personne.
              <span> Puis choisissez ce qu’il faut examiner en premier.</span>
            </h2>
            <button className="button button-hero" onClick={() => openTrial()}>
              Analyser ma marque <b aria-hidden="true">→</b>
            </button>
            <p>Créez votre espace et préparez votre premier diagnostic guidé.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div className="footer-brand">
            <Image
              src="/relief-visibility-os-lockup-on-dark.png"
              alt="Relief Visibility OS"
              width={626}
              height={141}
              unoptimized
            />
            <p>
              Relief mesure la visibilité d’une marque dans les réponses IA,
              explique les écarts observés et aide à choisir les actions à vérifier.
            </p>
          </div>
          <div>
            <strong>Produit</strong>
            <a href="#produit">Audit IA</a>
            <a href="#methode">Méthode</a>
            <a href="#evolution">Évolutions Google</a>
            <a href="#offres">Offres</a>
          </div>
          <div>
            <strong>Ressources</strong>
            <a href="#faq">FAQ</a>
            <a href="/methodologie">Méthodologie</a>
            <button
              className="footer-link-button"
              onClick={() => openTrial()}
              type="button"
            >
              Demander un accès
            </button>
            <a href="/espace">Connexion</a>
          </div>
          <div>
            <strong>Légal</strong>
            <a href="/mentions-legales">Mentions légales</a>
            <a href="/confidentialite">Confidentialité</a>
            <a href="/cgv">Conditions de vente</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Relief Visibility OS</span>
          <span>Produit conçu en France.</span>
        </div>
      </footer>

      <button
        className={
          showMobileCta
            ? "mobile-trial-cta is-visible"
            : "mobile-trial-cta"
        }
        onClick={() => openTrial()}
      >
        Analyser ma marque <span aria-hidden="true">→</span>
      </button>

      {trialOpen && (
        <div className="modal-backdrop" onMouseDown={() => setTrialOpen(false)}>
          <div
            className="trial-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-title"
            onMouseDown={(event) => event.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setTrialOpen(false)}
            >
              ×
            </button>

            {formState === "success" ? (
              <div
                className="trial-success"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span aria-hidden="true">✓</span>
                <small>Demande d’essai enregistrée</small>
                <h2 id="trial-title" ref={successHeadingRef} tabIndex={-1}>
                  Il ne reste plus qu’à ouvrir votre espace.
                </h2>
                <p>{formMessage}</p>
                <a className="button" href="/espace">
                  Ouvrir mon espace <b aria-hidden="true">→</b>
                </a>
                <small>
                  Connectez-vous avec la même adresse e-mail, puis confirmez
                  l’entreprise à auditer avant l’activation.
                </small>
              </div>
            ) : (
              <>
                <div className="modal-heading">
                  {selectedPlanName && (
                    <span>Offre envisagée : {selectedPlanName}</span>
                  )}
                  <h2 id="trial-title">Essayez Relief pendant 7 jours.</h2>
                  <p>
                    {TRIAL_OFFER.measures} mesures pour {TRIAL_OFFER.projects}
                    entreprises, sans carte bancaire.
                  </p>
                </div>

                <form onSubmit={submitTrial}>
                  <input
                    type="hidden"
                    name="plan"
                    value={selectedPlanDetails.code}
                  />
                  <input
                    type="hidden"
                    name="profile"
                    value={selectedPlanDetails.code}
                  />
                  <input
                    type="hidden"
                    name="expectedMonthlyMeasures"
                    value={selectedPlanDetails.measures}
                  />
                  <label className="form-trap" aria-hidden="true">
                    Site web
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                  <div className="field-row">
                    <label>
                      Nom et prénom
                      <input
                        name="fullName"
                        autoComplete="name"
                        required
                        minLength={2}
                        placeholder="Sofiane Belmahi"
                      />
                    </label>
                    <label>
                      E-mail utilisé pour la connexion
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="vous@entreprise.fr"
                      />
                    </label>
                  </div>
                  <label>
                    Entreprise ou projet
                    <input
                      name="companyName"
                      autoComplete="organization"
                      required
                      minLength={2}
                      placeholder="Nom de l’entreprise"
                    />
                  </label>
                  {formMessage && (
                    <p className="form-error" role="alert">
                      {formMessage}
                    </p>
                  )}
                  <button
                    className="button button-hero"
                    type="submit"
                    disabled={formState === "submitting"}
                  >
                    {formState === "submitting"
                      ? "Création de votre espace…"
                      : "Démarrer mon essai"}
                  </button>
                  <small className="form-legal">
                    En continuant, vous acceptez les{" "}
                    <a href="/cgv" target="_blank" rel="noreferrer">
                      conditions d’essai
                    </a>{" "}
                    et la{" "}
                    <a href="/confidentialite" target="_blank" rel="noreferrer">
                      politique de confidentialité
                    </a>
                    . Aucun prélèvement automatique.
                  </small>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
