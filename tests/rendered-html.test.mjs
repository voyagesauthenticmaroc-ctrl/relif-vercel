import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const port = 4178;
let productionServer;
let serverStderr = "";
let serverStdout = "";

before(async () => {
  const cli = new URL("../node_modules/vinext/dist/cli.js", import.meta.url);
  productionServer = spawn(
    process.execPath,
    [fileURLToPath(cli), "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: fileURLToPath(root),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  productionServer.stderr.on("data", (chunk) => {
    serverStderr = `${serverStderr}${chunk}`.slice(-8_000);
  });
  productionServer.stdout.on("data", (chunk) => {
    serverStdout = `${serverStdout}${chunk}`.slice(-8_000);
  });

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (productionServer.exitCode !== null) {
      throw new Error(`vinext start exited with code ${productionServer.exitCode}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(
    `Timed out waiting for the validation server\nstdout:\n${serverStdout}\nstderr:\n${serverStderr}`,
  );
});

after(() => {
  productionServer?.kill();
});

function render(pathname = "/") {
  return fetch(`http://127.0.0.1:${port}${pathname}`, {
    headers: { accept: "text/html" },
  });
}

test("server-renders the complete Relief commercial homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>Relief Visibility OS — Audit de visibilité dans les réponses IA<\/title>/i,
  );
  assert.match(html, /Découvrez si les IA recommandent votre entreprise/);
  assert.match(html, /Relief teste les questions que posent vos prospects/);
  assert.match(html, /Analyser ma marque/);
  assert.doesNotMatch(html, /Mettre les animations en pause/);
  assert.match(html, /Aucune carte demandée/);
  assert.match(html, /Marque/);
  assert.match(html, /Consultant/);
  assert.match(html, /Agence/);
  assert.match(html, /Démonstration · données illustratives/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"WebSite"/);
  assert.match(html, /"@type":"Organization"/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"@type":"Service"/);
  assert.doesNotMatch(html, /SoftwareApplication/);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/relief-visibility-fr\.souhoufyou\.chatgpt\.site\/"/,
  );
  assert.match(
    html,
    /<meta property="og:url" content="https:\/\/relief-visibility-fr\.souhoufyou\.chatgpt\.site\/"/,
  );
  assert.match(html, /property="og:image"/);
  assert.doesNotMatch(html, /react-loading-skeleton|Your site is taking shape/i);
});

test("keeps the offer, identity, and hosting configuration explicit", async () => {
  const [commercialSite, css, page, layout, plans, packageJson, hosting] =
    await Promise.all([
      readFile(new URL("../app/CommercialSite.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
      readFile(new URL("../lib/plans.ts", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    ]);

  assert.match(page, /<CommercialSite \/>/);
  assert.match(
    commercialSite,
    /className="brand"[\s\S]*relief-visibility-os-lockup-on-dark\.png/,
  );
  assert.match(
    commercialSite,
    /footer-brand[\s\S]*relief-visibility-os-lockup-on-dark\.png/,
  );
  assert.match(
    await readFile(new URL("../app/bienvenue/page.tsx", import.meta.url), "utf8"),
    /relief-visibility-os-lockup-on-dark\.png/,
  );
  assert.match(layout, /\/og-clarity\.png/);
  assert.match(layout, /export const metadata: Metadata/);
  assert.doesNotMatch(layout, /next\/headers|generateMetadata/);
  assert.match(commercialSite, /Démonstration · données illustratives/);
  assert.match(commercialSite, /aria-label="Période de facturation"/);
  assert.doesNotMatch(commercialSite, /liveScanFrames/);
  assert.match(commercialSite, /scroll-progress/);
  assert.match(commercialSite, /IntersectionObserver/);
  assert.match(commercialSite, /SignalField/);
  assert.doesNotMatch(commercialSite, /semantic-section/);
  assert.match(commercialSite, /engine-marquee/);
  assert.doesNotMatch(commercialSite, /signal-stream|engine-disclaimer/);
  assert.doesNotMatch(
    commercialSite,
    /Les mêmes questions, sur plusieurs assistants|Disponible aujourd’hui sur ChatGPT/,
  );
  assert.match(commercialSite, /successHeadingRef/);
  assert.doesNotMatch(
    commercialSite,
    /motionPaused|prefersReducedMotion|effectiveMotionPaused|motionOverride|handleMotionToggle/,
  );
  assert.match(commercialSite, /enableDecor \? "commercial-site motion-forced"/);
  assert.doesNotMatch(commercialSite, /className="motion-toggle"/);
  assert.match(commercialSite, /className="skip-link"/);
  assert.match(commercialSite, /role="tablist"/);
  assert.match(commercialSite, /aria-controls="demo-panel"/);
  assert.match(commercialSite, /onKeyDown=\{\(event\) => handleDemoTabKeyDown/);
  assert.match(commercialSite, /AbortController/);
  assert.match(commercialSite, /ai-logos\/openai\.svg/);
  assert.doesNotMatch(commercialSite, /Aucune affiliation n’est revendiquée/);
  assert.match(commercialSite, /Les connexions Google et le Content Studio/);
  assert.match(commercialSite, /Peut-on travailler à plusieurs/);
  assert.match(commercialSite, /ne sont pas inclus dans les tarifs affichés/);
  assert.match(commercialSite, /Lire la méthodologie complète/);
  assert.match(commercialSite, /Demander un accès/);
  assert.doesNotMatch(commercialSite, /mailto:|contact@reliefvisibility/);
  assert.doesNotMatch(commercialSite, /href=\{`\/espace\?plan=/);
  assert.match(
    commercialSite,
    /RELIEF_PLANS\.find\(\(plan\) => plan\.code === selectedPlan\) \?\?[\s\S]*RELIEF_PLANS\[0\]/,
  );
  assert.doesNotMatch(commercialSite, /className="evidence-strip"/);
  assert.doesNotMatch(commercialSite, /className="measure-definition"/);
  assert.doesNotMatch(commercialSite, /className="trial-proof"/);
  assert.match(commercialSite, /Quand un prospect demande une recommandation à une IA/);
  assert.match(
    commercialSite,
    /Quel prestataire choisir pour répondre à ce besoin dans ma région/,
  );
  assert.match(commercialSite, /Concurrent A/);
  assert.match(commercialSite, /Concurrent B/);
  const narrativeMarkers = [
    'id="produit"',
    'id="demonstration"',
    'id="methode"',
    'id="fonctionnalites"',
    'id="evolution"',
    'id="confiance"',
    'id="profils"',
    'id="offres"',
    'id="essai"',
  ];
  for (const marker of narrativeMarkers) {
    assert.notEqual(commercialSite.indexOf(marker), -1, `${marker} is missing`);
  }
  for (let index = 1; index < narrativeMarkers.length; index += 1) {
    assert.ok(
      commercialSite.indexOf(narrativeMarkers[index - 1]) <
        commercialSite.indexOf(narrativeMarkers[index]),
      `${narrativeMarkers[index - 1]} should precede ${narrativeMarkers[index]}`,
    );
  }
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /commercial-site\.motion-paused/);
  assert.match(css, /commercial-site\.motion-forced/);
  assert.match(css, /hero-orbit-breathe/);
  assert.match(css, /mix-blend-mode:\s*screen/);
  assert.match(commercialSite, /hero-orbit-media/);
  assert.match(commercialSite, /function HeroOrbitField/);
  assert.match(commercialSite, /className="hero-orbit-particles"/);
  assert.match(commercialSite, /Array\.from\(\{ length: 28 \}/);
  assert.match(commercialSite, /width \* \(0\.405 \+ orbit \* 0\.032\)/);
  assert.match(commercialSite, /height \* \(0\.17 \+ orbit \* 0\.028\)/);
  assert.match(
    commercialSite,
    /<HeroOrbitField paused=\{!enableDecor\} \/>/,
  );
  assert.match(
    commercialSite,
    /className="hero-orbit-media"[\s\S]*?<Image[\s\S]*?<HeroOrbitField/,
  );
  assert.doesNotMatch(commercialSite, /updatePointer|pointerDistance|--tilt-[xy]/);
  assert.doesNotMatch(
    commercialSite,
    /hero-orbit-label|hero-orbit-readout|Observation en cours/,
  );
  assert.doesNotMatch(
    commercialSite,
    /Audit de visibilité dans ChatGPT, Perplexity et Gemini|chapter-rail/,
  );
  assert.match(
    css,
    /\.commercial-site \.hero-orbit-media \{[\s\S]*?mix-blend-mode:\s*screen/,
  );
  assert.match(
    css,
    /\.commercial-site \.hero-orbit-particles \{[\s\S]*?pointer-events:\s*none/,
  );
  assert.match(
    css,
    /\.signal-field \{[\s\S]*?pointer-events:\s*none/,
  );
  assert.match(commercialSite, /width=\{1717\}[\s\S]*height=\{916\}/);
  assert.match(css, /demo-tab-progress/);
  assert.match(plans, /TRIAL_OFFER[\s\S]*days:\s*7/);
  assert.match(plans, /TRIAL_OFFER[\s\S]*measures:\s*60/);
  assert.match(plans, /monthlyPrice:\s*39/);
  assert.match(plans, /monthlyPrice:\s*109/);
  assert.match(plans, /monthlyPrice:\s*289/);
  assert.match(plans, /annualTotal:\s*390/);
  assert.match(plans, /annualTotal:\s*1_090/);
  assert.match(plans, /annualTotal:\s*2_890/);
  assert.doesNotMatch(plans, /Jusqu’à \d[\d\s]* audits/);
  assert.match(packageJson, /"name": "relief-visibility-os-commercial"/);
  assert.match(hosting, /appgprj_6a66715c075c8191aa89fe4ec713512b/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(css, /--blue:\s*#0b63f6/i);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.deepEqual(
    await readdir(new URL("../app/_sites-preview", import.meta.url)),
    [],
  );
  await access(new URL("../public/relief-visibility-os-logo.png", import.meta.url));
  await access(new URL("../public/og-clarity.png", import.meta.url));
  for (const logo of [
    "openai.svg",
    "perplexity.svg",
    "gemini.svg",
    "anthropic.svg",
    "mistral.svg",
    "deepseek.svg",
  ]) {
    await access(new URL(`../public/ai-logos/${logo}`, import.meta.url));
  }
});

test("keeps trial, billing, and entitlement processing durable", async () => {
  const [
    commercial,
    checkout,
    webhook,
    entitlement,
    portal,
    trial,
    trialActivation,
    spacePage,
    billingReadiness,
    stripe,
    securityHeaders,
    worker,
  ] =
    await Promise.all([
      readFile(new URL("../db/commercial.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../app/api/billing/checkout/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/billing/webhook/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/entitlement/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/billing/portal/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/api/trial/route.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../app/api/trial/activate/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/espace/page.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../lib/billing-readiness.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../lib/stripe.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../lib/security-headers.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    ]);

  assert.match(commercial, /provisionSubscription/);
  assert.match(commercial, /excluded\.last_event_created >= subscriptions\.last_event_created/);
  assert.match(commercial, /error IS NOT NULL/);
  assert.match(commercial, /trial_rate_limits/);
  assert.match(commercial, /ON CONFLICT\(email\) DO UPDATE SET/);
  assert.match(commercial, /WHERE trial_requests\.status = 'requested'/);
  assert.match(commercial, /company_name = COALESCE\(\?, company_name\)/);
  assert.match(commercial, /WHERE email = \? AND status = 'requested'/);
  assert.doesNotMatch(commercial, /authenticatedDisplayName\}\s*·\s*Relief/);
  assert.match(commercial, /billing_checkout_sessions/);
  assert.match(commercial, /used \+ \? <= "limit"/);
  assert.match(commercial, /subscriptionAccess \|\| trialAccess/);
  assert.match(commercial, /trial_requests\.status = 'trialing'/);
  assert.match(commercial, /datetime\('now', '-24 hours'\)/);
  assert.match(commercial, /input\.status === "active" \|\| input\.status === "trialing"/);
  assert.match(commercial, /monthlyQuotaPeriod/);
  assert.match(commercial, /usage_events/);
  assert.match(commercial, /reservation_key/);
  assert.match(commercial, /allowSubscriptionReplacement/);
  assert.match(
    commercial,
    /excluded\.stripe_subscription_id = subscriptions\.stripe_subscription_id/,
  );
  assert.match(commercial, /currentPeriodEnd: subscriptionAccess/);
  assert.match(commercial, /entitlementVersion:\s*1/);
  assert.match(
    commercial,
    /limits:\s*\{[\s\S]*historyMonths:[\s\S]*measures:[\s\S]*projects:[\s\S]*seats:/,
  );
  assert.match(checkout, /reserveCheckoutSession/);
  assert.match(checkout, /payment_method_types\[0\]/);
  assert.match(checkout, /!terminalBillingStatus/);
  assert.doesNotMatch(checkout, /trial_period_days/);
  assert.match(webhook, /customer\.subscription\.deleted/);
  assert.match(webhook, /eventOrder/);
  assert.match(webhook, /readLimitedBody/);
  assert.match(webhook, /payment_status/);
  assert.match(webhook, /livemode/);
  assert.match(webhook, /priceConfiguration/);
  assert.match(webhook, /item\?\.current_period_end/);
  assert.match(webhook, /invoice\.paid/);
  assert.match(webhook, /invoice\.payment_failed/);
  assert.match(webhook, /allowSubscriptionReplacement/);
  const customerSubscriptionHandlers = webhook.slice(
    webhook.indexOf('event.type === "customer.subscription.created"'),
    webhook.indexOf("await completeStripeEvent(event.id)"),
  );
  assert.doesNotMatch(customerSubscriptionHandlers, /stripeCustomerId:/);
  assert.match(entitlement, /RELIEF_ENTITLEMENT_API_SECRET/);
  assert.match(entitlement, /consumeCommercialUsage/);
  assert.match(portal, /billing_portal\/sessions/);
  assert.match(trial, /TRIAL_RATE_LIMIT_SECRET/);
  assert.match(trialActivation, /getChatGPTUser/);
  assert.match(trialActivation, /activateTrialForEmail/);
  assert.match(trialActivation, /companyName/);
  assert.match(trialActivation, /Origine non autorisée/);
  assert.match(spacePage, /findTrialByEmail/);
  assert.match(spacePage, /OnboardingWizard/);
  assert.match(commercial, /workspace_onboarding/);
  assert.match(commercial, /auth_rate_limits/);
  assert.match(spacePage, /isBillingCheckoutReady/);
  assert.doesNotMatch(spacePage, /activateTrialForEmail/);
  assert.match(billingReadiness, /STRIPE_WEBHOOK_SECRET/);
  assert.match(billingReadiness, /stripePriceEnv/);
  assert.match(stripe, /Idempotency-Key/);
  assert.match(stripe, /2026-02-25\.clover/);
  assert.match(stripe, /STRIPE_REQUEST_TIMEOUT_MS = 12_000/);
  assert.match(stripe, /AbortController/);
  assert.match(securityHeaders, /Content-Security-Policy/);
  assert.match(securityHeaders, /Strict-Transport-Security/);
  assert.match(securityHeaders, /isDevelopment \? " ws: wss:"/);
  assert.match(worker, /withSecurityHeaders\(response, url\)/);
  assert.match(worker, /response\.status === 101/);
  await access(
    new URL("../drizzle/0002_fluffy_solo.sql", import.meta.url),
  );
  await access(
    new URL("../drizzle/0003_sparkling_galactus.sql", import.meta.url),
  );
});

test("keeps account verification and team access server-controlled", async () => {
  const [
    signup,
    requestLink,
    verify,
    session,
    authRequest,
    onboarding,
    teamInvite,
    teamAccept,
  ] = await Promise.all([
    readFile(new URL("../app/api/auth/signup/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/api/auth/request-link/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/api/auth/verify/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/relief-session.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth-request.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/onboarding/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/team/invite/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/team/accept/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(signup, /allowAuthLinkRequest/);
  assert.match(signup, /authRedirect/);
  assert.doesNotMatch(signup, /new URL\(request\.url\)\.origin/);
  assert.match(requestLink, /isReliefEmailReady/);
  assert.doesNotMatch(requestLink, /new URL\(request\.url\)\.origin/);
  assert.match(verify, /export async function POST/);
  assert.doesNotMatch(verify, /export async function GET/);
  assert.match(session, /__Host-relief_session/);
  assert.match(session, /createAuthSessionRecord/);
  assert.match(session, /revokeAuthSessionRecord/);
  assert.match(authRequest, /process\.env\.NODE_ENV !== "production"/);
  assert.match(onboarding, /saveOnboarding/);
  assert.match(onboarding, /activateTrialForEmail/);
  assert.match(teamInvite, /getWorkspaceMembership/);
  assert.match(teamInvite, /entitlement\.limits\.seats/);
  assert.match(teamAccept, /acceptWorkspaceInvitation/);
});

test("renders the three required legal information pages", async () => {
  for (const [pathname, heading] of [
    ["/mentions-legales", "Mentions légales"],
    ["/confidentialite", "Politique de confidentialité"],
    ["/cgv", "Conditions générales de vente"],
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(heading));
    assert.match(html, /<meta name="robots" content="noindex, follow"/);
    assert.match(
      html,
      new RegExp(
        `<link rel="canonical" href="https://relief-visibility-fr\\.souhoufyou\\.chatgpt\\.site${pathname}"`,
      ),
    );
  }
});

test("publishes crawl controls and a useful GEO methodology page", async () => {
  const robotsResponse = await render("/robots.txt");
  assert.equal(robotsResponse.status, 200);
  assert.match(
    robotsResponse.headers.get("content-type") ?? "",
    /^text\/plain\b/i,
  );
  const robots = await robotsResponse.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /User-Agent: OAI-SearchBot/i);
  assert.match(robots, /Disallow: \/api\//i);
  assert.match(
    robots,
    /Sitemap: https:\/\/relief-visibility-fr\.souhoufyou\.chatgpt\.site\/sitemap\.xml/i,
  );

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  assert.match(
    sitemapResponse.headers.get("content-type") ?? "",
    /(?:application|text)\/xml/i,
  );
  const sitemap = await sitemapResponse.text();
  assert.match(
    sitemap,
    /https:\/\/relief-visibility-fr\.souhoufyou\.chatgpt\.site\/methodologie/,
  );
  assert.doesNotMatch(sitemap, /\/espace|\/bienvenue|\/api\/|\/cgv/);

  const methodologyResponse = await render("/methodologie");
  assert.equal(methodologyResponse.status, 200);
  const methodology = await methodologyResponse.text();
  assert.match(
    methodology,
    /<title>Méthodologie d’audit de visibilité IA et GEO · Relief Visibility OS<\/title>/,
  );
  assert.match(
    methodology,
    /<link rel="canonical" href="https:\/\/relief-visibility-fr\.souhoufyou\.chatgpt\.site\/methodologie"/,
  );
  assert.match(
    methodology,
    /Comment Relief mesure la visibilité d’une marque dans les réponses IA/,
  );
  assert.match(methodology, /1 question × 1 assistant × 1 passage/);
  assert.match(
    methodology,
    /Ce qu’un audit Relief ne permet pas d’affirmer/,
  );
  assert.doesNotMatch(methodology, /name="robots" content="noindex/);
});
