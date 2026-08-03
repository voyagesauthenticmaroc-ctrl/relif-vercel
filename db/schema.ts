import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const trialRequests = sqliteTable(
  "trial_requests",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    companyName: text("company_name").notNull(),
    profile: text("profile").notNull(),
    planCode: text("plan_code").notNull().default("consultant"),
    expectedMonthlyMeasures: integer("expected_monthly_measures")
      .notNull()
      .default(300),
    status: text("status").notNull().default("requested"),
    billingEventCreated: integer("billing_event_created").notNull().default(0),
    trialStartsAt: text("trial_starts_at"),
    trialEndsAt: text("trial_ends_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("trial_requests_email_idx").on(table.email),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind").notNull().default("solo"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("workspaces_stripe_customer_idx").on(table.stripeCustomerId),
  ],
);

export const memberships = sqliteTable(
  "memberships",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    planCode: text("plan_code").notNull(),
    billingCycle: text("billing_cycle").notNull().default("monthly"),
    status: text("status").notNull(),
    trialEnd: text("trial_end"),
    currentPeriodStart: text("current_period_start"),
    currentPeriodEnd: text("current_period_end"),
    cancelAtPeriodEnd: integer("cancel_at_period_end", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    lastEventCreated: integer("last_event_created").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("subscriptions_workspace_idx").on(table.workspaceId),
    uniqueIndex("subscriptions_stripe_id_idx").on(
      table.stripeSubscriptionId,
    ),
  ],
);

export const usageCounters = sqliteTable(
  "usage_counters",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    metric: text("metric").notNull().default("ai_measure"),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    used: integer("used").notNull().default(0),
    limit: integer("limit").notNull(),
    sourceEventOrder: integer("source_event_order").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({
      columns: [table.workspaceId, table.metric, table.periodStart],
    }),
  ],
);

export const usageEvents = sqliteTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    metric: text("metric").notNull().default("ai_measure"),
    periodStart: text("period_start").notNull(),
    amount: integer("amount").notNull(),
    usedBefore: integer("used_before").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("usage_events_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  objectId: text("object_id"),
  eventCreated: integer("event_created").notNull(),
  processingStartedAt: text("processing_started_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  processedAt: text("processed_at"),
  error: text("error"),
  attempts: integer("attempts").notNull().default(1),
});

export const billingCheckoutSessions = sqliteTable(
  "billing_checkout_sessions",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    planCode: text("plan_code").notNull(),
    billingCycle: text("billing_cycle").notNull(),
    stripeSessionId: text("stripe_session_id"),
    checkoutUrl: text("checkout_url"),
    status: text("status").notNull().default("creating"),
    reservationKey: text("reservation_key"),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("billing_checkout_email_status_idx").on(table.email, table.status),
    uniqueIndex("billing_checkout_stripe_session_idx").on(
      table.stripeSessionId,
    ),
    uniqueIndex("billing_checkout_reservation_idx").on(table.reservationKey),
  ],
);

export const trialRateLimits = sqliteTable("trial_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  windowStartedAt: text("window_started_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const emailVerificationLinks = sqliteTable(
  "email_verification_links",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("email_verification_links_token_idx").on(table.tokenHash),
    index("email_verification_links_email_idx").on(
      table.email,
      table.createdAt,
    ),
  ],
);

export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(1),
  windowStartedAt: text("window_started_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastRequestAt: text("last_request_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const workspaceOnboarding = sqliteTable("workspace_onboarding", {
  email: text("email").primaryKey(),
  role: text("role").notNull(),
  companyName: text("company_name").notNull(),
  domain: text("domain").notNull(),
  country: text("country").notNull(),
  sector: text("sector").notNull(),
  objective: text("objective").notNull(),
  competitorsJson: text("competitors_json").notNull().default("[]"),
  questionsJson: text("questions_json").notNull().default("[]"),
  status: text("status").notNull().default("completed"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("auth_sessions_email_idx").on(table.email, table.createdAt),
  ],
);

export const workspaceInvitations = sqliteTable(
  "workspace_invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("analyst"),
    tokenHash: text("token_hash").notNull(),
    invitedBy: text("invited_by").notNull(),
    status: text("status").notNull().default("pending"),
    expiresAt: text("expires_at").notNull(),
    acceptedAt: text("accepted_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("workspace_invitations_token_idx").on(table.tokenHash),
    index("workspace_invitations_workspace_idx").on(
      table.workspaceId,
      table.status,
    ),
  ],
);
