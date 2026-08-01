import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { currencyValidator } from "./schema";

const rateIntervalValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
);
const payoutStyleValidator = v.union(v.literal("accrual"), v.literal("end_of_term"));

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireVerifiedUser(ctx);
    const plans = await ctx.db
      .query("investmentPlans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return plans.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Public/unauthenticated -- powers the marketing site's plans teaser.
// Deliberately the same shape as `listActive` (plan terms are meant to be
// public marketing information; nothing sensitive lives on this table).
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("investmentPlans")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();
    return plans.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const plans = await ctx.db.query("investmentPlans").collect();
    return plans.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Real rate/term decisions are the operator's business call -- nothing here
// fabricates plan terms.
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    minDepositUsd: v.number(),
    maxDepositUsd: v.optional(v.number()),
    currency: v.union(currencyValidator, v.literal("ANY")),
    rate: v.number(),
    rateInterval: rateIntervalValidator,
    durationDays: v.number(),
    payoutStyle: payoutStyleValidator,
    features: v.optional(v.array(v.string())),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.minDepositUsd <= 0) throw new Error("minDepositUsd must be greater than zero");
    if (args.maxDepositUsd !== undefined && args.maxDepositUsd < args.minDepositUsd) {
      throw new Error("maxDepositUsd cannot be less than minDepositUsd");
    }
    if (args.rate <= 0) throw new Error("rate must be greater than zero");
    if (args.durationDays <= 0) throw new Error("durationDays must be greater than zero");

    const planId = await ctx.db.insert("investmentPlans", {
      ...args,
      features: args.features ?? [],
      isActive: true,
      sortOrder: args.sortOrder ?? 0,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "create_plan",
      targetTable: "investmentPlans",
      targetId: planId,
      after: args,
    });

    return planId;
  },
});

export const update = mutation({
  args: {
    planId: v.id("investmentPlans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    minDepositUsd: v.optional(v.number()),
    maxDepositUsd: v.optional(v.number()),
    rate: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const { planId, ...patch } = args;
    const plan = await ctx.db.get(planId);
    if (!plan) throw new Error("Plan not found");

    // Rate changes only affect new investments -- existing investments
    // already locked their own rate/rateInterval/payoutStyle copy at
    // investment time (see convex/investments.ts).
    await ctx.db.patch(planId, patch);

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "update_plan",
      targetTable: "investmentPlans",
      targetId: planId,
      before: plan,
      after: patch,
    });
  },
});

export const deactivate = mutation({
  args: { planId: v.id("investmentPlans") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    await ctx.db.patch(args.planId, { isActive: false });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "deactivate_plan",
      targetTable: "investmentPlans",
      targetId: args.planId,
      before: { isActive: true },
      after: { isActive: false },
    });
  },
});

const DEFAULT_PLAN_FEATURES = [
  "100% Capital Protection",
  "Automated Payout",
  "A.I Integrated Trading",
  "10% Referral Bonus",
  "Daily Turnover",
  "Renewable",
];

// Terms as handed down by the operator (see task description) -- not
// fabricated. Run once via `npx convex run investmentPlans:seedDefaultPlans`.
const DEFAULT_PLANS = [
  {
    name: "Starter Plan",
    description: "An entry-level tier for investors getting started with A.I-managed trading.",
    minDepositUsd: 200,
    maxDepositUsd: 1499,
    rate: 0.015,
    durationDays: 5,
  },
  {
    name: "Apex Plan",
    description: "A mid-tier plan for investors ready to scale up their daily turnover.",
    minDepositUsd: 1500,
    maxDepositUsd: 6999,
    rate: 0.02,
    durationDays: 5,
  },
  {
    name: "Thrive Plan",
    description: "A higher-yield tier for investors committing larger capital.",
    minDepositUsd: 7000,
    maxDepositUsd: 14999,
    rate: 0.03,
    durationDays: 5,
  },
  {
    name: "Premium Plan",
    description: "The top tier, built for substantial capital over an extended term.",
    minDepositUsd: 15000,
    maxDepositUsd: 1000000,
    rate: 0.05,
    durationDays: 31,
  },
] as const;

// Idempotent by plan name -- safe to re-run; existing plans are left as-is
// so admin edits made after seeding are never clobbered.
export const seedDefaultPlans = internalMutation({
  args: { adminUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const admin = args.adminUserId
      ? await ctx.db.get(args.adminUserId)
      : await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", "admin"))
          .first();
    if (!admin) throw new Error("No admin user found -- create one first or pass adminUserId");

    const existing = await ctx.db.query("investmentPlans").collect();
    const existingNames = new Set(existing.map((p) => p.name));

    const inserted: string[] = [];
    for (let i = 0; i < DEFAULT_PLANS.length; i++) {
      const plan = DEFAULT_PLANS[i];
      if (existingNames.has(plan.name)) continue;
      await ctx.db.insert("investmentPlans", {
        name: plan.name,
        description: plan.description,
        minDepositUsd: plan.minDepositUsd,
        maxDepositUsd: plan.maxDepositUsd,
        currency: "ANY",
        rate: plan.rate,
        rateInterval: "daily",
        durationDays: plan.durationDays,
        payoutStyle: "accrual",
        features: [...DEFAULT_PLAN_FEATURES],
        isActive: true,
        sortOrder: i,
        createdBy: admin._id,
        createdAt: Date.now(),
      });
      inserted.push(plan.name);
    }

    return { inserted, skipped: DEFAULT_PLANS.map((p) => p.name).filter((n) => !inserted.includes(n)) };
  },
});
