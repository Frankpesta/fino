import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// All monetary fields (balances, amounts) are stored as fixed-precision decimal
// numbers rounded to 8 decimal places on every write. Never write a raw float to
// one of these fields directly -- always route through lib/money.ts's `round8`
// helper first. See docs/01-data-model.md "Design notes".

export const CURRENCIES = ["BTC", "ETH", "USDT", "USDC", "BNB"] as const;
export const currencyValidator = v.union(
  v.literal("BTC"),
  v.literal("ETH"),
  v.literal("USDT"),
  v.literal("USDC"),
  v.literal("BNB"),
);

const balancesValidator = v.object({
  BTC: v.number(),
  ETH: v.number(),
  USDT: v.number(),
  USDC: v.number(),
  BNB: v.number(),
});

// Per-event-type email toggles (docs/06-phase-5-referrals-profile.md 5.2).
// Security-critical emails (verification, password/2FA changes) always send
// regardless of these -- see docs/07-phase-6-emails-notifications.md 6.3.
export const notificationPreferencesValidator = v.object({
  depositApproved: v.boolean(),
  depositRejected: v.boolean(),
  withdrawalApproved: v.boolean(),
  withdrawalRejected: v.boolean(),
  investmentMatured: v.boolean(),
  referralCommissionEarned: v.boolean(),
});

export function defaultNotificationPreferences() {
  return {
    depositApproved: true,
    depositRejected: true,
    withdrawalApproved: true,
    withdrawalRejected: true,
    investmentMatured: true,
    referralCommissionEarned: true,
  };
}

export default defineSchema({
  // authTables provides Convex Auth's own users/sessions/accounts tables.
  // We extend the "users" table below with our own app-specific fields instead
  // of maintaining a separate profile table, per Convex Auth's recommended pattern.
  ...authTables,

  users: defineTable({
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned"),
    ),
    referredBy: v.optional(v.id("users")),
    referralCode: v.string(),
    balances: balancesValidator,
    twoFactorEnabled: v.boolean(),
    // AES-GCM encrypted TOTP secret (see lib/secretBox.ts + convex/model/
    // secrets.ts) -- never stored in plaintext. Set once setup begins;
    // twoFactorEnabled only flips true after the user verifies a code
    // against it (see convex/profile.ts).
    twoFactorSecret: v.optional(v.string()),
    notificationPreferences: v.optional(notificationPreferencesValidator),
    deletionRequestedAt: v.optional(v.number()),
    createdAt: v.number(),
    lastLoginAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_referralCode", ["referralCode"])
    .index("by_role", ["role"]),

  emailVerifications: defineTable({
    userId: v.id("users"),
    code: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    lastSentAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_code", ["code"]),

  passwordResets: defineTable({
    userId: v.id("users"),
    code: v.string(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    lastSentAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_code", ["code"]),

  // Rate limits 2FA code guesses at sign-in. Password attempts against the
  // same account are already rate-limited by Convex Auth itself
  // (retrieveAccount -> authRateLimits, 10/hour, token-bucket) -- this
  // mirrors that same shape for the 2FA step, which is our own custom logic
  // and isn't covered by that built-in mechanism.
  twoFactorAttempts: defineTable({
    userId: v.id("users"),
    attemptsLeft: v.number(),
    lastAttemptTime: v.number(),
  }).index("by_userId", ["userId"]),

  investmentPlans: defineTable({
    name: v.string(),
    description: v.string(),
    // USD-denominated tiers -- a deposit's live USD value is what selects a
    // plan (see lib/planMatching.ts), independent of which coin is used, so
    // thresholds live in USD rather than in the plan's own currency.
    minDepositUsd: v.number(),
    maxDepositUsd: v.optional(v.number()),
    currency: v.union(currencyValidator, v.literal("ANY")),
    rate: v.number(),
    rateInterval: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    durationDays: v.number(),
    payoutStyle: v.union(v.literal("accrual"), v.literal("end_of_term")),
    isActive: v.boolean(),
    sortOrder: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_isActive", ["isActive"]),

  investments: defineTable({
    userId: v.id("users"),
    planId: v.id("investmentPlans"),
    principal: v.number(),
    currency: currencyValidator,
    // rate/rateInterval/payoutStyle are copied from the plan at investment time
    // and never change afterward, even if the admin edits the plan later.
    rate: v.number(),
    rateInterval: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    payoutStyle: v.union(v.literal("accrual"), v.literal("end_of_term")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    startedAt: v.number(),
    endsAt: v.number(),
    totalAccrued: v.number(),
    lastAccrualAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_endsAt", ["endsAt"]),

  deposits: defineTable({
    userId: v.id("users"),
    // The native-currency amount actually expected on-chain -- always
    // `amountUsd / quotedRate` computed server-side at submission time, in
    // the same fixed 8-decimal precision as every other ledger amount. This
    // is what's credited to the user's balance on approval; never a raw
    // client-supplied number.
    amount: v.number(),
    currency: currencyValidator,
    // What the user actually typed and what plan-matching runs against
    // (see lib/planMatching.ts). Informational + matching only -- balances
    // stay denominated in native currency, never in USD.
    amountUsd: v.number(),
    quotedRate: v.number(),
    matchedPlanId: v.optional(v.id("investmentPlans")),
    destinationWalletAddress: v.string(),
    proofFileId: v.optional(v.id("_storage")),
    txHash: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  withdrawals: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    currency: currencyValidator,
    destinationAddress: v.string(),
    note: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    payoutTxHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("investment"),
      v.literal("payout"),
      v.literal("referral_commission"),
      v.literal("admin_adjustment"),
    ),
    amount: v.number(),
    currency: currencyValidator,
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    relatedId: v.optional(v.string()),
    performedBy: v.id("users"),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_type", ["type"]),

  referrals: defineTable({
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    commissionRate: v.number(),
    // Per-currency, not a single summed number -- a referred user's
    // deposits can be in different assets across time, and there's no price
    // oracle in this build to combine them honestly (same reasoning as
    // convex/dashboard.ts).
    totalCommissionEarned: balancesValidator,
    createdAt: v.number(),
  })
    .index("by_referrerId", ["referrerId"])
    .index("by_referredUserId", ["referredUserId"]),

  adminAuditLog: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetTable: v.string(),
    targetId: v.string(),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_adminId", ["adminId"])
    .index("by_targetTable", ["targetTable"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"]),

  platformWallets: defineTable({
    currency: currencyValidator,
    address: v.string(),
    network: v.string(),
    isActive: v.boolean(),
  }).index("by_currency", ["currency"]),

  emailLog: defineTable({
    userId: v.optional(v.id("users")),
    to: v.string(),
    template: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  platformSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // Cached USD price per unit of each currency, refreshed on a cron (see
  // convex/exchangeRates.ts). A single row per currency, upserted in place --
  // reads always come from this cache, never a live external call, so
  // interactive flows (deposit quoting, dashboard totals) stay fast and
  // don't depend on a third party being up.
  exchangeRates: defineTable({
    currency: currencyValidator,
    usdRate: v.number(),
    updatedAt: v.number(),
  }).index("by_currency", ["currency"]),

  // Marketing-site "Contact us" form submissions -- public/unauthenticated
  // writes (see convex/contact.ts), so treated as untrusted input: length
  // capped, no HTML rendering, admin notified by email rather than
  // relying on anyone actively checking this table.
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
