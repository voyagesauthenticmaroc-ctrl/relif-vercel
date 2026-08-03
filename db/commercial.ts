import { env } from "cloudflare:workers";
import { getPlan, TRIAL_OFFER } from "../lib/plans";

export type TrialRecord = {
  billing_event_created: number;
  company_name: string;
  created_at: string;
  email: string;
  expected_monthly_measures: number;
  full_name: string;
  id: string;
  plan_code: string;
  profile: string;
  status: string;
  trial_ends_at: string | null;
  trial_starts_at: string | null;
};

export type OnboardingRecord = {
  company_name: string;
  competitors_json: string;
  country: string;
  domain: string;
  email: string;
  objective: string;
  questions_json: string;
  role: string;
  sector: string;
  status: string;
};

export type WorkspaceMemberRecord = {
  display_name: string;
  email: string;
  role: string;
  status: "active" | "pending";
};

type SubscriptionRecord = {
  billing_cycle: string;
  cancel_at_period_end: number;
  current_period_end: string | null;
  current_period_start: string | null;
  display_name: string;
  last_event_created: number;
  plan_code: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_end: string | null;
  workspace_id: string;
  workspace_name: string;
};

type BillingCheckoutRecord = {
  billing_cycle: string;
  checkout_url: string | null;
  email: string;
  expires_at: string;
  id: string;
  plan_code: string;
  reservation_key: string | null;
  status: string;
  stripe_session_id: string | null;
};

export type CommercialEntitlement = {
  access: boolean;
  billingCycle: "annual" | "monthly" | null;
  billingStatus: string | null;
  cancelAtPeriodEnd: boolean;
  companyName: string;
  currentPeriodEnd: string | null;
  displayName: string;
  email: string;
  entitlementVersion: 1;
  limit: number;
  limits: {
    historyMonths: number;
    measures: number;
    projects: number;
    seats: number;
  };
  planCode: string;
  readOnly: boolean;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  used: number;
  usagePeriodStart: string | null;
  workspaceId: string | null;
};

type ProvisionSubscriptionInput = {
  allowSubscriptionReplacement?: boolean;
  billingCycle: "annual" | "monthly";
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: number | null;
  currentPeriodStart?: number | null;
  displayName?: string | null;
  email: string;
  eventCreated: number;
  eventOrder?: number;
  planCode: string;
  status: string;
  stripeCustomerId?: string | null;
  stripePriceId?: string | null;
  stripeSubscriptionId?: string | null;
  trialEnd?: number | null;
};

let tablesReady: Promise<void> | null = null;

function getD1() {
  if (!env.DB) {
    throw new Error("La base d’essai Relief n’est pas disponible.");
  }
  return env.DB;
}

export async function ensureCommercialTables() {
  if (tablesReady) return tablesReady;

  tablesReady = (async () => {
    const db = getD1();
    await db.batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS trial_requests (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          full_name TEXT NOT NULL,
          company_name TEXT NOT NULL,
          profile TEXT NOT NULL,
          plan_code TEXT NOT NULL DEFAULT 'consultant',
          expected_monthly_measures INTEGER NOT NULL DEFAULT 300,
          status TEXT NOT NULL DEFAULT 'requested',
          billing_event_created INTEGER NOT NULL DEFAULT 0,
          trial_starts_at TEXT,
          trial_ends_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS trial_requests_email_idx ON trial_requests (email)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          display_name TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          kind TEXT NOT NULL DEFAULT 'solo',
          stripe_customer_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS workspaces_stripe_customer_idx ON workspaces (stripe_customer_id)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS memberships (
          workspace_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'owner',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (workspace_id, user_id),
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          workspace_id TEXT NOT NULL,
          stripe_subscription_id TEXT,
          stripe_price_id TEXT,
          plan_code TEXT NOT NULL,
          billing_cycle TEXT NOT NULL DEFAULT 'monthly',
          status TEXT NOT NULL,
          trial_end TEXT,
          current_period_start TEXT,
          current_period_end TEXT,
          cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
          last_event_created INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )`,
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_workspace_idx ON subscriptions (workspace_id)",
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON subscriptions (stripe_subscription_id)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS usage_counters (
          workspace_id TEXT NOT NULL,
          metric TEXT NOT NULL DEFAULT 'ai_measure',
          period_start TEXT NOT NULL,
          period_end TEXT NOT NULL,
          used INTEGER NOT NULL DEFAULT 0,
          "limit" INTEGER NOT NULL,
          source_event_order INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (workspace_id, metric, period_start),
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS usage_events (
          id TEXT PRIMARY KEY NOT NULL,
          workspace_id TEXT NOT NULL,
          metric TEXT NOT NULL DEFAULT 'ai_measure',
          period_start TEXT NOT NULL,
          amount INTEGER NOT NULL,
          used_before INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )`,
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS usage_events_workspace_created_idx ON usage_events (workspace_id, created_at)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS stripe_events (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL,
          object_id TEXT,
          event_created INTEGER NOT NULL,
          processing_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          processed_at TEXT,
          error TEXT,
          attempts INTEGER NOT NULL DEFAULT 1
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS billing_checkout_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          plan_code TEXT NOT NULL,
          billing_cycle TEXT NOT NULL,
          stripe_session_id TEXT,
          checkout_url TEXT,
          status TEXT NOT NULL DEFAULT 'creating',
          reservation_key TEXT,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS billing_checkout_email_status_idx ON billing_checkout_sessions (email, status)",
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS billing_checkout_stripe_session_idx ON billing_checkout_sessions (stripe_session_id)",
      ),
      db.prepare(
        "CREATE UNIQUE INDEX IF NOT EXISTS billing_checkout_reservation_idx ON billing_checkout_sessions (reservation_key)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS trial_rate_limits (
          key TEXT PRIMARY KEY NOT NULL,
          count INTEGER NOT NULL DEFAULT 1,
          window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS email_verification_links (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          full_name TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          used_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS email_verification_links_email_idx ON email_verification_links (email, created_at)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS auth_rate_limits (
          key TEXT PRIMARY KEY NOT NULL,
          count INTEGER NOT NULL DEFAULT 1,
          window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_request_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS workspace_onboarding (
          email TEXT PRIMARY KEY NOT NULL,
          role TEXT NOT NULL,
          company_name TEXT NOT NULL,
          domain TEXT NOT NULL,
          country TEXT NOT NULL,
          sector TEXT NOT NULL,
          objective TEXT NOT NULL,
          competitors_json TEXT NOT NULL DEFAULT '[]',
          questions_json TEXT NOT NULL DEFAULT '[]',
          status TEXT NOT NULL DEFAULT 'completed',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          email TEXT NOT NULL,
          full_name TEXT,
          expires_at TEXT NOT NULL,
          revoked_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS auth_sessions_email_idx ON auth_sessions (email, created_at)",
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS workspace_invitations (
          id TEXT PRIMARY KEY NOT NULL,
          workspace_id TEXT NOT NULL,
          email TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'analyst',
          token_hash TEXT NOT NULL UNIQUE,
          invited_by TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          expires_at TEXT NOT NULL,
          accepted_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )`,
      ),
      db.prepare(
        "CREATE INDEX IF NOT EXISTS workspace_invitations_workspace_idx ON workspace_invitations (workspace_id, status)",
      ),
    ]);
  })().catch((error) => {
    tablesReady = null;
    throw error;
  });

  return tablesReady;
}

async function stableId(prefix: string, value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  const suffix = [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}_${suffix}`;
}

async function keyedId(prefix: string, value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  const suffix = [...new Uint8Array(digest)]
    .slice(0, 18)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}_${suffix}`;
}

function normalizeD1Date(value: string | null) {
  if (!value) return null;
  if (value.includes("T")) return value;
  return `${value.replace(" ", "T")}Z`;
}

function epochToIso(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1_000).toISOString();
}

function defaultPeriod(eventCreated: number) {
  const start = new Date(eventCreated * 1_000);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function addUtcMonthsClamped(anchor: Date, months: number) {
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth() + months;
  const firstOfTarget = new Date(
    Date.UTC(
      year,
      month,
      1,
      anchor.getUTCHours(),
      anchor.getUTCMinutes(),
      anchor.getUTCSeconds(),
      anchor.getUTCMilliseconds(),
    ),
  );
  const lastDay = new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();
  firstOfTarget.setUTCDate(Math.min(anchor.getUTCDate(), lastDay));
  return firstOfTarget;
}

function monthlyQuotaPeriod(
  billingStart: string,
  billingEnd: string,
  at = new Date(),
) {
  const anchor = new Date(billingStart);
  const billingEndDate = new Date(billingEnd);
  if (
    Number.isNaN(anchor.getTime()) ||
    Number.isNaN(billingEndDate.getTime()) ||
    billingEndDate <= anchor
  ) {
    return { end: billingEnd, start: billingStart };
  }

  const effectiveAt =
    at < anchor ? anchor : at > billingEndDate ? billingEndDate : at;
  let start = anchor;
  for (let monthIndex = 1; monthIndex <= 240; monthIndex += 1) {
    const next = addUtcMonthsClamped(anchor, monthIndex);
    if (effectiveAt < next || next >= billingEndDate) {
      const end = next < billingEndDate ? next : billingEndDate;
      return { end: end.toISOString(), start: start.toISOString() };
    }
    start = next;
  }

  return { end: billingEndDate.toISOString(), start: start.toISOString() };
}

function isFuture(value: string | null) {
  const normalized = normalizeD1Date(value);
  return normalized ? Date.parse(normalized) > Date.now() : false;
}

export async function upsertTrialRequest(input: {
  companyName: string;
  email: string;
  expectedMonthlyMeasures: number;
  fullName: string;
  planCode: string;
  profile: string;
}) {
  await ensureCommercialTables();
  const db = getD1();
  const email = input.email.toLowerCase();
  const id = await stableId("trial", email);

  const inserted = await db
    .prepare(
      `INSERT INTO trial_requests (
        id,
        email,
        full_name,
        company_name,
        profile,
        plan_code,
        expected_monthly_measures,
        status,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        full_name = excluded.full_name,
        company_name = excluded.company_name,
        profile = excluded.profile,
        plan_code = excluded.plan_code,
        expected_monthly_measures = excluded.expected_monthly_measures,
        updated_at = CURRENT_TIMESTAMP
      WHERE trial_requests.status = 'requested'`,
    )
    .bind(
      id,
      email,
      input.fullName,
      input.companyName,
      input.profile,
      input.planCode,
      input.expectedMonthlyMeasures,
    )
    .run();

  return (inserted.meta?.changes ?? 0) > 0;
}

function tokenHash(value: string) {
  return crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  ).then((digest) => [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""));
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createEmailVerificationLink(input: {
  email: string;
  fullName: string;
}) {
  await ensureCommercialTables();
  const token = randomToken();
  const hash = await tokenHash(token);
  const id = await stableId("verification", `${input.email}:${hash}`);
  await getD1().batch([
    getD1()
      .prepare(
        `DELETE FROM email_verification_links
         WHERE datetime(expires_at) < CURRENT_TIMESTAMP
            OR (email = ? AND used_at IS NOT NULL)`,
      )
      .bind(input.email.toLowerCase()),
    getD1()
      .prepare(
        `INSERT INTO email_verification_links (id, email, full_name, token_hash, expires_at)
         VALUES (?, ?, ?, ?, datetime('now', '+24 hours'))`,
      )
      .bind(id, input.email.toLowerCase(), input.fullName, hash),
  ]);
  await getD1()
    .prepare(
      `DELETE FROM email_verification_links
       WHERE id IN (
         SELECT id FROM email_verification_links
         WHERE email = ? AND used_at IS NULL
         ORDER BY created_at DESC
         LIMIT -1 OFFSET 5
       )`,
    )
    .bind(input.email.toLowerCase())
    .run();
  return token;
}

export async function allowAuthLinkRequest(input: {
  cooldownSeconds: number;
  identifier: string;
  limit: number;
  secret: string;
}) {
  if (input.secret.length < 32) throw new Error("Auth rate-limit secret is not configured");
  await ensureCommercialTables();
  const key = await keyedId("auth-rate", input.identifier, input.secret);
  const cooldown = `-${Math.max(1, input.cooldownSeconds)} seconds`;
  const row = await getD1()
    .prepare(
      `INSERT INTO auth_rate_limits (key, count, window_started_at, last_request_at)
       VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN window_started_at < datetime('now', '-1 hour') THEN 1
           ELSE count + 1
         END,
         window_started_at = CASE
           WHEN window_started_at < datetime('now', '-1 hour') THEN CURRENT_TIMESTAMP
           ELSE window_started_at
         END,
         last_request_at = CURRENT_TIMESTAMP
       WHERE auth_rate_limits.last_request_at <= datetime('now', ?)
          OR auth_rate_limits.window_started_at < datetime('now', '-1 hour')
       RETURNING count`,
    )
    .bind(key, cooldown)
    .first<{ count: number }>();
  return Boolean(row && row.count <= input.limit);
}

export async function consumeEmailVerificationLink(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  await ensureCommercialTables();
  const hash = await tokenHash(token);
  const db = getD1();
  const record = await db
    .prepare(
      `SELECT email, full_name FROM email_verification_links
       WHERE token_hash = ? AND used_at IS NULL AND datetime(expires_at) > CURRENT_TIMESTAMP
       LIMIT 1`,
    )
    .bind(hash)
    .first<{ email: string; full_name: string }>();
  if (!record) return null;
  const updated = await db
    .prepare(
      `UPDATE email_verification_links SET used_at = CURRENT_TIMESTAMP
       WHERE token_hash = ? AND used_at IS NULL`,
    )
    .bind(hash)
    .run();
  if ((updated.meta?.changes ?? 0) !== 1) return null;
  return record;
}

export async function getOnboardingByEmail(emailInput: string) {
  await ensureCommercialTables();
  return getD1()
    .prepare("SELECT * FROM workspace_onboarding WHERE email = ? LIMIT 1")
    .bind(emailInput.trim().toLowerCase())
    .first<OnboardingRecord>();
}

export async function saveOnboarding(input: {
  companyName: string;
  competitors: string[];
  country: string;
  domain: string;
  email: string;
  objective: string;
  questions: string[];
  role: string;
  sector: string;
}) {
  await ensureCommercialTables();
  await getD1()
    .prepare(
      `INSERT INTO workspace_onboarding (
         email, role, company_name, domain, country, sector, objective,
         competitors_json, questions_json, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
       ON CONFLICT(email) DO UPDATE SET
         role = excluded.role,
         company_name = excluded.company_name,
         domain = excluded.domain,
         country = excluded.country,
         sector = excluded.sector,
         objective = excluded.objective,
         competitors_json = excluded.competitors_json,
         questions_json = excluded.questions_json,
         status = 'completed',
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      input.email.trim().toLowerCase(),
      input.role,
      input.companyName,
      input.domain,
      input.country,
      input.sector,
      input.objective,
      JSON.stringify(input.competitors),
      JSON.stringify(input.questions),
    )
    .run();
}

export async function createAuthSessionRecord(input: {
  email: string;
  fullName: string | null;
  ttlSeconds: number;
}) {
  await ensureCommercialTables();
  const id = randomToken();
  const expiresAt = new Date(Date.now() + input.ttlSeconds * 1_000).toISOString();
  await getD1()
    .prepare(
      `INSERT INTO auth_sessions (id, email, full_name, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, input.email.toLowerCase(), input.fullName, expiresAt)
    .run();
  return id;
}

export async function getAuthSessionRecord(id: string) {
  if (!/^[a-f0-9]{64}$/i.test(id)) return null;
  await ensureCommercialTables();
  const record = await getD1()
    .prepare(
      `SELECT email, full_name
       FROM auth_sessions
       WHERE id = ?
         AND revoked_at IS NULL
         AND datetime(expires_at) > CURRENT_TIMESTAMP
       LIMIT 1`,
    )
    .bind(id)
    .first<{ email: string; full_name: string | null }>();
  if (record) {
    await getD1()
      .prepare(
        `UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP
         WHERE id = ? AND last_seen_at < datetime('now', '-15 minutes')`,
      )
      .bind(id)
      .run();
  }
  return record;
}

export async function revokeAuthSessionRecord(id: string) {
  if (!/^[a-f0-9]{64}$/i.test(id)) return;
  await ensureCommercialTables();
  await getD1()
    .prepare(
      `UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP
       WHERE id = ? AND revoked_at IS NULL`,
    )
    .bind(id)
    .run();
}

export async function getWorkspaceMembership(emailInput: string, workspaceId: string) {
  await ensureCommercialTables();
  return getD1()
    .prepare(
      `SELECT m.role
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.workspace_id = ? AND u.email = ?
       LIMIT 1`,
    )
    .bind(workspaceId, emailInput.trim().toLowerCase())
    .first<{ role: string }>();
}

export async function listWorkspaceMembers(workspaceId: string) {
  await ensureCommercialTables();
  const active = await getD1()
    .prepare(
      `SELECT u.email, u.display_name, m.role, 'active' AS status
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.workspace_id = ?
       ORDER BY m.created_at ASC`,
    )
    .bind(workspaceId)
    .all<WorkspaceMemberRecord>();
  const pending = await getD1()
    .prepare(
      `SELECT email, email AS display_name, role, 'pending' AS status
       FROM workspace_invitations
       WHERE workspace_id = ? AND status = 'pending'
         AND datetime(expires_at) > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
    )
    .bind(workspaceId)
    .all<WorkspaceMemberRecord>();
  return [...(active.results ?? []), ...(pending.results ?? [])];
}

export async function createWorkspaceInvitation(input: {
  email: string;
  invitedBy: string;
  role: "admin" | "analyst" | "viewer";
  workspaceId: string;
}) {
  await ensureCommercialTables();
  const token = randomToken();
  const hash = await tokenHash(token);
  const id = await stableId("invite", `${input.workspaceId}:${input.email}:${hash}`);
  await getD1()
    .prepare(
      `INSERT INTO workspace_invitations (
         id, workspace_id, email, role, token_hash, invited_by, expires_at
       ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))`,
    )
    .bind(
      id,
      input.workspaceId,
      input.email.toLowerCase(),
      input.role,
      hash,
      input.invitedBy.toLowerCase(),
    )
    .run();
  return token;
}

export async function acceptWorkspaceInvitation(input: {
  fullName: string;
  token: string;
}) {
  if (!/^[a-f0-9]{64}$/i.test(input.token)) return null;
  await ensureCommercialTables();
  const hash = await tokenHash(input.token);
  const db = getD1();
  const invitation = await db
    .prepare(
      `SELECT id, workspace_id, email, role
       FROM workspace_invitations
       WHERE token_hash = ? AND status = 'pending'
         AND datetime(expires_at) > CURRENT_TIMESTAMP
       LIMIT 1`,
    )
    .bind(hash)
    .first<{ email: string; id: string; role: string; workspace_id: string }>();
  if (!invitation) return null;
  const userId = await stableId("user", invitation.email);
  const accepted = await db.batch([
    db
      .prepare(
        `UPDATE workspace_invitations
         SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
         WHERE id = ? AND status = 'pending'`,
      )
      .bind(invitation.id),
    db
      .prepare(
        `INSERT INTO users (id, email, display_name)
         VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           display_name = excluded.display_name,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(userId, invitation.email, input.fullName),
    db
      .prepare(
        `INSERT OR IGNORE INTO memberships (workspace_id, user_id, role)
         VALUES (?, ?, ?)`,
      )
      .bind(invitation.workspace_id, userId, invitation.role),
  ]);
  if ((accepted[0]?.meta?.changes ?? 0) !== 1) return null;
  return { email: invitation.email, fullName: input.fullName };
}

export async function allowTrialRequest(
  identifier: string | null,
  secret: string,
) {
  if (secret.length < 32) {
    throw new Error("Trial rate-limit secret is not configured");
  }
  if (!identifier) return true;
  await ensureCommercialTables();
  await getD1()
    .prepare(
      `DELETE FROM trial_rate_limits
       WHERE "key" IN (
         SELECT "key"
         FROM trial_rate_limits
         WHERE window_started_at < datetime('now', '-24 hours')
         LIMIT 100
       )`,
    )
    .run();
  const key = await keyedId("rate", identifier, secret);
  const row = await getD1()
    .prepare(
      `INSERT INTO trial_rate_limits ("key", "count", window_started_at)
       VALUES (?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT("key") DO UPDATE SET
         "count" = CASE
           WHEN window_started_at < datetime('now', '-1 hour') THEN 1
           ELSE "count" + 1
         END,
         window_started_at = CASE
           WHEN window_started_at < datetime('now', '-1 hour')
             THEN CURRENT_TIMESTAMP
           ELSE window_started_at
         END
       RETURNING "count"`,
    )
    .bind(key)
    .first<{ count: number }>();

  return (row?.count ?? 1) <= 10;
}

export type CheckoutReservation =
  | {
      kind: "ready";
      reused: boolean;
      url: string;
    }
  | {
      kind: "reserved";
    }
  | {
      kind: "pending" | "rate_limited";
    };

export async function reserveCheckoutSession(input: {
  billingCycle: "annual" | "monthly";
  email: string;
  id: string;
  planCode: string;
}): Promise<CheckoutReservation> {
  await ensureCommercialTables();
  const db = getD1();
  const email = input.email.trim().toLowerCase();
  const reservationKey = await stableId("checkout-reservation", email);

  await db
    .prepare(
      `UPDATE billing_checkout_sessions
       SET status = 'expired',
           reservation_key = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE (
         status IN ('creating', 'open')
         AND datetime(expires_at) <= CURRENT_TIMESTAMP
       ) OR (
         status = 'creating'
         AND updated_at < datetime('now', '-2 minutes')
       )`,
    )
    .run();

  const reusable = await db
    .prepare(
      `SELECT *
       FROM billing_checkout_sessions
       WHERE email = ?
         AND plan_code = ?
         AND billing_cycle = ?
         AND status = 'open'
         AND checkout_url IS NOT NULL
         AND datetime(expires_at) > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(email, input.planCode, input.billingCycle)
    .first<BillingCheckoutRecord>();

  if (reusable?.checkout_url) {
    return { kind: "ready", reused: true, url: reusable.checkout_url };
  }

  const recent = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM billing_checkout_sessions
       WHERE email = ?
         AND created_at > datetime('now', '-10 minutes')`,
    )
    .bind(email)
    .first<{ count: number }>();
  if ((recent?.count ?? 0) >= 6) {
    return { kind: "rate_limited" };
  }

  const expiresAt = new Date(Date.now() + 35 * 60_000).toISOString();
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO billing_checkout_sessions (
         id, email, plan_code, billing_cycle, status, reservation_key, expires_at
       ) VALUES (?, ?, ?, ?, 'creating', ?, ?)`,
    )
    .bind(
      input.id,
      email,
      input.planCode,
      input.billingCycle,
      reservationKey,
      expiresAt,
    )
    .run();

  if ((inserted.meta?.changes ?? 0) > 0) {
    return { kind: "reserved" };
  }

  const existing = await db
    .prepare(
      `SELECT *
       FROM billing_checkout_sessions
       WHERE id = ? OR reservation_key = ?
       ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END
       LIMIT 1`,
    )
    .bind(input.id, reservationKey, input.id)
    .first<BillingCheckoutRecord>();
  if (
    !existing ||
    existing.email !== email
  ) {
    throw new Error("Checkout idempotency key ownership mismatch");
  }

  if (
    existing.status === "open" &&
    existing.plan_code === input.planCode &&
    existing.billing_cycle === input.billingCycle &&
    existing.checkout_url &&
    isFuture(existing.expires_at)
  ) {
    return { kind: "ready", reused: true, url: existing.checkout_url };
  }

  return { kind: "pending" };
}

export async function completeCheckoutSession(input: {
  email: string;
  expiresAt: number;
  id: string;
  stripeSessionId: string;
  url: string;
}) {
  await ensureCommercialTables();
  const expiresAt = epochToIso(input.expiresAt);
  if (!expiresAt) throw new Error("Invalid Stripe Checkout expiration");

  const updated = await getD1()
    .prepare(
      `UPDATE billing_checkout_sessions
       SET stripe_session_id = ?,
           checkout_url = ?,
           status = 'open',
           expires_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND email = ? AND status = 'creating'`,
    )
    .bind(
      input.stripeSessionId,
      input.url,
      expiresAt,
      input.id,
      input.email.toLowerCase(),
    )
    .run();
  if ((updated.meta?.changes ?? 0) === 0) {
    throw new Error("Checkout reservation could not be completed");
  }
}

export async function failCheckoutSession(id: string, email: string) {
  await ensureCommercialTables();
  await getD1()
    .prepare(
      `UPDATE billing_checkout_sessions
       SET status = 'failed',
           reservation_key = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND email = ? AND status = 'creating'`,
    )
    .bind(id, email.toLowerCase())
    .run();
}

export async function markCheckoutSessionStatus(
  stripeSessionId: string,
  status: "complete" | "expired",
) {
  await ensureCommercialTables();
  await getD1()
    .prepare(
      `UPDATE billing_checkout_sessions
       SET status = ?,
           checkout_url = NULL,
           reservation_key = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_session_id = ?`,
    )
    .bind(status, stripeSessionId)
    .run();
}

export async function findCheckoutSessionIdentity(stripeSessionId: string) {
  await ensureCommercialTables();
  return getD1()
    .prepare(
      `SELECT email, plan_code, billing_cycle
       FROM billing_checkout_sessions
       WHERE stripe_session_id = ?
       LIMIT 1`,
    )
    .bind(stripeSessionId)
    .first<{
      billing_cycle: string;
      email: string;
      plan_code: string;
    }>();
}

export async function findTrialByEmail(email: string) {
  await ensureCommercialTables();
  return getD1()
    .prepare("SELECT * FROM trial_requests WHERE email = ? LIMIT 1")
    .bind(email.toLowerCase())
    .first<TrialRecord>();
}

async function provisionTrialWorkspace(trial: TrialRecord) {
  const db = getD1();
  const userId = await stableId("user", trial.email);
  const workspaceId = await stableId("workspace", trial.email);
  const periodStart =
    normalizeD1Date(trial.trial_starts_at) ?? new Date().toISOString();
  const periodEnd =
    normalizeD1Date(trial.trial_ends_at) ??
    new Date(Date.now() + TRIAL_OFFER.days * 86_400_000).toISOString();

  await db.batch([
    db
      .prepare(
        `INSERT INTO users (id, email, display_name)
         VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           display_name = excluded.display_name,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(userId, trial.email, trial.full_name),
    db
      .prepare(
        `INSERT INTO workspaces (id, name, kind)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           kind = excluded.kind,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(workspaceId, trial.company_name, trial.profile),
    db
      .prepare(
        `INSERT OR IGNORE INTO memberships (workspace_id, user_id, role)
         VALUES (?, ?, 'owner')`,
      )
      .bind(workspaceId, userId),
    db
      .prepare(
        `INSERT INTO usage_counters (
           workspace_id, metric, period_start, period_end, used, "limit"
         ) VALUES (?, 'ai_measure', ?, ?, 0, ?)
         ON CONFLICT(workspace_id, metric, period_start) DO UPDATE SET
           "limit" = MAX("limit", excluded."limit"),
           period_end = excluded.period_end,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        workspaceId,
        periodStart,
        periodEnd,
        TRIAL_OFFER.measures,
      ),
  ]);
}

export async function activateTrialForEmail(
  email: string,
  authenticatedDisplayName: string,
  confirmedCompanyName?: string | null,
) {
  await ensureCommercialTables();
  const db = getD1();
  const normalizedEmail = email.toLowerCase();
  const companyName = confirmedCompanyName?.trim().slice(0, 120) || null;
  await db
    .prepare(
      `UPDATE trial_requests
       SET status = 'trialing',
           full_name = ?,
           company_name = COALESCE(?, company_name),
           trial_starts_at = COALESCE(trial_starts_at, CURRENT_TIMESTAMP),
           trial_ends_at = COALESCE(trial_ends_at, datetime('now', '+7 days')),
           updated_at = CURRENT_TIMESTAMP
       WHERE email = ? AND status = 'requested'`,
    )
    .bind(
      authenticatedDisplayName,
      companyName,
      normalizedEmail,
    )
    .run();

  const trial = await findTrialByEmail(normalizedEmail);
  if (trial && (trial.status === "requested" || trial.status === "trialing")) {
    await provisionTrialWorkspace(trial);
  }
  return trial;
}

export async function beginStripeEvent(input: {
  created: number;
  eventId: string;
  objectId: string | null;
  type: string;
}) {
  await ensureCommercialTables();
  const db = getD1();
  const inserted = await db
    .prepare(
      `INSERT OR IGNORE INTO stripe_events (
        id, type, object_id, event_created
      ) VALUES (?, ?, ?, ?)`,
    )
    .bind(input.eventId, input.type, input.objectId, input.created)
    .run();

  if ((inserted.meta?.changes ?? 0) > 0) return true;

  const retried = await db
    .prepare(
      `UPDATE stripe_events
       SET processing_started_at = CURRENT_TIMESTAMP,
           processed_at = NULL,
           error = NULL,
           attempts = attempts + 1
       WHERE id = ?
         AND (
           error IS NOT NULL OR
           (processed_at IS NULL AND processing_started_at < datetime('now', '-10 minutes'))
         )`,
    )
    .bind(input.eventId)
    .run();

  return (retried.meta?.changes ?? 0) > 0;
}

export async function completeStripeEvent(eventId: string, error?: string) {
  await ensureCommercialTables();
  await getD1()
    .prepare(
      `UPDATE stripe_events
       SET processed_at = CURRENT_TIMESTAMP, error = ?
       WHERE id = ?`,
    )
    .bind(error ?? null, eventId)
    .run();
}

export async function provisionSubscription(
  input: ProvisionSubscriptionInput,
) {
  await ensureCommercialTables();
  const plan = getPlan(input.planCode);
  if (!plan) throw new Error(`Unknown Relief plan: ${input.planCode}`);

  const db = getD1();
  const email = input.email.trim().toLowerCase();
  const trial = await findTrialByEmail(email);
  const displayName =
    trial?.full_name ||
    input.displayName?.trim() ||
    email.split("@")[0] ||
    "Compte Relief";
  const companyName = trial?.company_name || `Espace de ${displayName}`;
  const userId = await stableId("user", email);
  const workspaceId = await stableId("workspace", email);
  const trialId = trial?.id ?? (await stableId("trial", email));
  const subscriptionId = await stableId("subscription", email);
  const eventOrder = input.eventOrder ?? input.eventCreated;
  const fallbackPeriod = defaultPeriod(input.eventCreated);
  const existingPeriod = await db
    .prepare(
      `SELECT
         current_period_start,
         current_period_end,
         last_event_created,
         stripe_subscription_id
       FROM subscriptions
       WHERE workspace_id = ?
       LIMIT 1`,
    )
    .bind(workspaceId)
    .first<{
      current_period_end: string | null;
      current_period_start: string | null;
      last_event_created: number;
      stripe_subscription_id: string | null;
    }>();
  if (
    existingPeriod?.stripe_subscription_id &&
    input.stripeSubscriptionId &&
    existingPeriod.stripe_subscription_id !== input.stripeSubscriptionId &&
    !input.allowSubscriptionReplacement
  ) {
    return;
  }
  if (
    existingPeriod &&
    eventOrder < existingPeriod.last_event_created
  ) {
    return;
  }
  const periodStart =
    epochToIso(input.currentPeriodStart) ??
    existingPeriod?.current_period_start ??
    fallbackPeriod.start;
  const periodEnd =
    epochToIso(input.currentPeriodEnd) ??
    existingPeriod?.current_period_end ??
    fallbackPeriod.end;
  const trialEnd = epochToIso(input.trialEnd);
  const quotaPeriod = monthlyQuotaPeriod(
    periodStart,
    periodEnd,
    new Date(input.eventCreated * 1_000),
  );

  const statements = [
    db
      .prepare(
        `INSERT INTO users (id, email, display_name)
         VALUES (?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           display_name = excluded.display_name,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(userId, email, displayName),
    db
      .prepare(
        `INSERT INTO workspaces (
           id, name, kind, stripe_customer_id
         ) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           kind = excluded.kind,
           stripe_customer_id = COALESCE(
             excluded.stripe_customer_id,
             workspaces.stripe_customer_id
           ),
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        workspaceId,
        companyName,
        plan.code,
        input.stripeCustomerId ?? null,
      ),
    db
      .prepare(
        `INSERT OR IGNORE INTO memberships (workspace_id, user_id, role)
         VALUES (?, ?, 'owner')`,
      )
      .bind(workspaceId, userId),
    db
      .prepare(
        `INSERT INTO trial_requests (
           id,
           email,
           full_name,
           company_name,
           profile,
           plan_code,
           expected_monthly_measures,
           status,
           billing_event_created
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           plan_code = excluded.plan_code,
           profile = excluded.profile,
           expected_monthly_measures = excluded.expected_monthly_measures,
           status = CASE
             WHEN excluded.status IN ('active', 'trialing')
               THEN excluded.status
             WHEN trial_requests.status = 'trialing'
               AND datetime(trial_requests.trial_ends_at) > CURRENT_TIMESTAMP
               THEN trial_requests.status
             ELSE excluded.status
           END,
           billing_event_created = excluded.billing_event_created,
           updated_at = CURRENT_TIMESTAMP
         WHERE excluded.billing_event_created >= trial_requests.billing_event_created`,
      )
      .bind(
        trialId,
        email,
        displayName,
        companyName,
        plan.code,
        plan.code,
        plan.measures,
        input.status,
        eventOrder,
      ),
    db
      .prepare(
        `INSERT INTO subscriptions (
           id,
           workspace_id,
           stripe_subscription_id,
           stripe_price_id,
           plan_code,
           billing_cycle,
           status,
           trial_end,
           current_period_start,
           current_period_end,
           cancel_at_period_end,
           last_event_created
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(workspace_id) DO UPDATE SET
           stripe_subscription_id = COALESCE(
             excluded.stripe_subscription_id,
             subscriptions.stripe_subscription_id
           ),
           stripe_price_id = COALESCE(
             excluded.stripe_price_id,
             subscriptions.stripe_price_id
           ),
           plan_code = excluded.plan_code,
           billing_cycle = excluded.billing_cycle,
           status = excluded.status,
           trial_end = COALESCE(excluded.trial_end, subscriptions.trial_end),
           current_period_start = excluded.current_period_start,
           current_period_end = excluded.current_period_end,
           cancel_at_period_end = excluded.cancel_at_period_end,
           last_event_created = excluded.last_event_created,
           updated_at = CURRENT_TIMESTAMP
         WHERE excluded.last_event_created >= subscriptions.last_event_created
           AND (
             ? = 1 OR
             subscriptions.stripe_subscription_id IS NULL OR
             excluded.stripe_subscription_id IS NULL OR
             excluded.stripe_subscription_id = subscriptions.stripe_subscription_id
           )`,
      )
      .bind(
        subscriptionId,
        workspaceId,
        input.stripeSubscriptionId ?? null,
        input.stripePriceId ?? null,
        plan.code,
        input.billingCycle,
        input.status,
        trialEnd,
        periodStart,
        periodEnd,
        input.cancelAtPeriodEnd ? 1 : 0,
        eventOrder,
        input.allowSubscriptionReplacement ? 1 : 0,
      ),
  ];

  if (input.status === "active" || input.status === "trialing") {
    statements.push(
      db
        .prepare(
          `INSERT INTO usage_counters (
             workspace_id, metric, period_start, period_end, used, "limit",
             source_event_order
           ) VALUES (?, 'ai_measure', ?, ?, 0, ?, ?)
           ON CONFLICT(workspace_id, metric, period_start) DO UPDATE SET
             "limit" = excluded."limit",
             period_end = excluded.period_end,
             source_event_order = excluded.source_event_order,
             updated_at = CURRENT_TIMESTAMP
           WHERE excluded.source_event_order >= usage_counters.source_event_order`,
        )
        .bind(
          workspaceId,
          quotaPeriod.start,
          quotaPeriod.end,
          plan.measures,
          eventOrder,
        ),
    );
  }

  await db.batch(statements);
}

export async function getCommercialEntitlement(
  emailInput: string,
): Promise<CommercialEntitlement | null> {
  await ensureCommercialTables();
  const db = getD1();
  const email = emailInput.toLowerCase();
  const trial = await findTrialByEmail(email);
  const subscription = await db
    .prepare(
      `SELECT
         s.workspace_id,
         s.stripe_subscription_id,
         s.plan_code,
         s.billing_cycle,
         s.status,
         s.trial_end,
         s.current_period_start,
         s.current_period_end,
         s.cancel_at_period_end,
         s.last_event_created,
         u.display_name,
         w.name AS workspace_name,
         w.stripe_customer_id
       FROM subscriptions s
       JOIN workspaces w ON w.id = s.workspace_id
       JOIN memberships m ON m.workspace_id = w.id
       JOIN users u ON u.id = m.user_id
       WHERE u.email = ?
       ORDER BY s.last_event_created DESC
       LIMIT 1`,
    )
    .bind(email)
    .first<SubscriptionRecord>();

  if (!trial && !subscription) return null;

  const subscriptionAccess =
    !!subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    (!subscription.current_period_end ||
      isFuture(subscription.current_period_end));
  const trialAccess =
    !!trial &&
    trial.status === "trialing" &&
    isFuture(trial.trial_ends_at);
  const access = subscriptionAccess || trialAccess;
  const workspaceId = subscription?.workspace_id ??
    (trial ? await stableId("workspace", email) : null);
  const planCode = subscription?.plan_code ?? trial?.plan_code ?? "consultant";
  const plan = getPlan(planCode);
  const paidQuotaPeriod =
    subscriptionAccess &&
    subscription?.current_period_start &&
    subscription.current_period_end
      ? monthlyQuotaPeriod(
          subscription.current_period_start,
          subscription.current_period_end,
        )
      : null;

  if (
    paidQuotaPeriod &&
    workspaceId &&
    plan &&
    subscription
  ) {
    await db
      .prepare(
        `INSERT INTO usage_counters (
           workspace_id, metric, period_start, period_end, used, "limit",
           source_event_order
         ) VALUES (?, 'ai_measure', ?, ?, 0, ?, ?)
         ON CONFLICT(workspace_id, metric, period_start) DO UPDATE SET
           "limit" = excluded."limit",
           period_end = excluded.period_end,
           source_event_order = excluded.source_event_order,
           updated_at = CURRENT_TIMESTAMP
         WHERE excluded.source_event_order >= usage_counters.source_event_order`,
      )
      .bind(
        workspaceId,
        paidQuotaPeriod.start,
        paidQuotaPeriod.end,
        plan.measures,
        subscription.last_event_created,
      )
      .run();
  }

  const usagePeriodStart = subscriptionAccess
    ? paidQuotaPeriod?.start ?? null
    : trialAccess
      ? normalizeD1Date(trial?.trial_starts_at ?? null)
      : null;
  const usage = workspaceId && usagePeriodStart
    ? await db
        .prepare(
          `SELECT used, "limit"
           FROM usage_counters
           WHERE workspace_id = ? AND period_start = ?
           LIMIT 1`,
        )
        .bind(workspaceId, usagePeriodStart)
        .first<{ limit: number; used: number }>()
    : null;
  const limit =
    usage?.limit ??
    (subscriptionAccess
      ? plan?.measures ?? 0
      : trialAccess
        ? TRIAL_OFFER.measures
        : 0);
  const billingCycle =
    subscription?.billing_cycle === "annual" ||
    subscription?.billing_cycle === "monthly"
      ? subscription.billing_cycle
      : null;

  return {
    access,
    billingCycle,
    billingStatus: subscription?.status ?? null,
    cancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
    companyName:
      trial?.company_name ?? subscription?.workspace_name ?? "Compte Relief",
    currentPeriodEnd: subscriptionAccess
      ? subscription?.current_period_end ?? null
      : null,
    displayName:
      trial?.full_name ?? subscription?.display_name ?? email.split("@")[0],
    email,
    entitlementVersion: 1,
    limit,
    limits: {
      historyMonths: subscriptionAccess
        ? plan?.historyMonths ?? 0
        : trialAccess
          ? TRIAL_OFFER.historyMonths
          : 0,
      measures: limit,
      projects: subscriptionAccess
        ? plan?.projects ?? 0
        : trialAccess
          ? TRIAL_OFFER.projects
          : 0,
      seats: subscriptionAccess
        ? plan?.seats ?? 0
        : trialAccess
          ? TRIAL_OFFER.seats
          : 0,
    },
    planCode,
    readOnly: !access || (usage?.used ?? 0) >= limit,
    status: subscriptionAccess
      ? subscription?.status ?? "active"
      : trialAccess
        ? "trialing"
        : subscription?.status ?? trial?.status ?? "inactive",
    stripeCustomerId: subscription?.stripe_customer_id ?? null,
    stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    trialEndsAt: trial?.trial_ends_at ?? subscription?.trial_end ?? null,
    used: usage?.used ?? 0,
    usagePeriodStart,
    workspaceId,
  };
}

export async function findBillingIdentity(input: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  await ensureCommercialTables();
  if (!input.stripeCustomerId && !input.stripeSubscriptionId) return null;

  return getD1()
    .prepare(
      `SELECT u.email, s.plan_code, s.stripe_price_id
       FROM subscriptions s
       JOIN workspaces w ON w.id = s.workspace_id
       JOIN memberships m ON m.workspace_id = w.id
       JOIN users u ON u.id = m.user_id
       WHERE (
         ? IS NOT NULL AND s.stripe_subscription_id = ?
       ) OR (
         ? IS NOT NULL AND w.stripe_customer_id = ?
       )
       ORDER BY s.last_event_created DESC
       LIMIT 1`,
    )
    .bind(
      input.stripeSubscriptionId ?? null,
      input.stripeSubscriptionId ?? null,
      input.stripeCustomerId ?? null,
      input.stripeCustomerId ?? null,
    )
    .first<{
      email: string;
      plan_code: string;
      stripe_price_id: string | null;
    }>();
}

export async function consumeCommercialUsage(
  emailInput: string,
  amount: number,
  idempotencyKey: string,
) {
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    throw new Error("Usage amount must be an integer between 1 and 100");
  }

  const email = emailInput.trim().toLowerCase();
  const entitlement = await getCommercialEntitlement(email);
  if (
    !entitlement?.access ||
    !entitlement.workspaceId ||
    !entitlement.usagePeriodStart
  ) {
    return {
      consumed: false,
      entitlement,
      reason: "access_inactive" as const,
    };
  }

  const row = await getD1()
    .batch([
      getD1()
        .prepare(
          `INSERT OR IGNORE INTO usage_events (
             id, workspace_id, metric, period_start, amount, used_before, status
           )
           SELECT ?, workspace_id, metric, period_start, ?, used, 'pending'
           FROM usage_counters
           WHERE workspace_id = ?
             AND metric = 'ai_measure'
             AND period_start = ?
             AND datetime(period_start) <= CURRENT_TIMESTAMP
             AND datetime(period_end) > CURRENT_TIMESTAMP
             AND used + ? <= "limit"
             AND (
               EXISTS (
                 SELECT 1
                 FROM subscriptions s
                 WHERE s.workspace_id = usage_counters.workspace_id
                   AND s.status IN ('active', 'trialing')
                   AND (
                     s.current_period_end IS NULL OR
                     datetime(s.current_period_end) > CURRENT_TIMESTAMP
                   )
               ) OR EXISTS (
                 SELECT 1
                 FROM memberships m
                 JOIN users u ON u.id = m.user_id
                 JOIN trial_requests t ON t.email = u.email
                 WHERE m.workspace_id = usage_counters.workspace_id
                   AND t.status = 'trialing'
                   AND datetime(t.trial_ends_at) > CURRENT_TIMESTAMP
               )
             )`,
        )
        .bind(
          idempotencyKey,
          amount,
          entitlement.workspaceId,
          entitlement.usagePeriodStart,
          amount,
        ),
      getD1()
        .prepare(
          `UPDATE usage_counters
           SET used = used + ?, updated_at = CURRENT_TIMESTAMP
           WHERE workspace_id = ?
             AND metric = 'ai_measure'
             AND period_start = ?
             AND used = (
               SELECT used_before
               FROM usage_events
               WHERE id = ?
                 AND workspace_id = ?
                 AND period_start = ?
                 AND amount = ?
                 AND status = 'pending'
             )
             AND used + ? <= "limit"`,
        )
        .bind(
          amount,
          entitlement.workspaceId,
          entitlement.usagePeriodStart,
          idempotencyKey,
          entitlement.workspaceId,
          entitlement.usagePeriodStart,
          amount,
          amount,
        ),
      getD1()
        .prepare(
          `UPDATE usage_events
           SET status = 'consumed'
           WHERE id = ?
             AND workspace_id = ?
             AND period_start = ?
             AND amount = ?
             AND status = 'pending'
             AND EXISTS (
               SELECT 1
               FROM usage_counters c
               WHERE c.workspace_id = usage_events.workspace_id
                 AND c.metric = usage_events.metric
                 AND c.period_start = usage_events.period_start
                 AND c.used = usage_events.used_before + usage_events.amount
             )`,
        )
        .bind(
          idempotencyKey,
          entitlement.workspaceId,
          entitlement.usagePeriodStart,
          amount,
        ),
    ]);
  const usageEvent = await getD1()
    .prepare(
      `SELECT workspace_id, period_start, amount, status
       FROM usage_events
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(idempotencyKey)
    .first<{
      amount: number;
      period_start: string;
      status: string;
      workspace_id: string;
    }>();

  if (
    usageEvent &&
    (usageEvent.workspace_id !== entitlement.workspaceId ||
      usageEvent.amount !== amount)
  ) {
    throw new Error("Usage idempotency key ownership mismatch");
  }

  if (usageEvent?.status !== "consumed") {
    const refreshedEntitlement = await getCommercialEntitlement(email);
    return {
      consumed: false,
      entitlement: refreshedEntitlement,
      reason: refreshedEntitlement?.access
        ? ("quota_exhausted" as const)
        : ("access_inactive" as const),
    };
  }

  const refreshedEntitlement = await getCommercialEntitlement(email);
  return {
    consumed: true,
    entitlement: refreshedEntitlement,
    reason: null,
    replayed: (row[0]?.meta?.changes ?? 0) === 0,
  };
}
