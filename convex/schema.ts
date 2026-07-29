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

  investmentPlans: defineTable({
    name: v.string(),
    description: v.string(),
    minDeposit: v.number(),
    maxDeposit: v.optional(v.number()),
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
    amount: v.number(),
    currency: currencyValidator,
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
    .index("by_type", ["type"]),

  referrals: defineTable({
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    commissionRate: v.number(),
    totalCommissionEarned: v.number(),
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
});
