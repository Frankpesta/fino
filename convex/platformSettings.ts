import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdmin } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { SETTINGS_KEYS, defaultMinWithdrawalAmount } from "./model/settings";
import type { Currency } from "../lib/currency";

// Readable by anyone authenticated (used to show the minimum on the
// withdrawal form) -- these aren't sensitive, unlike platformWallets
// addresses which stay admin-only until surfaced deliberately per currency.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("platformSettings").collect();
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      minWithdrawalAmount:
        (byKey[SETTINGS_KEYS.minWithdrawalAmount] as Record<Currency, number> | undefined) ??
        defaultMinWithdrawalAmount(),
      referralCommissionRateDefault:
        (byKey[SETTINGS_KEYS.referralCommissionRateDefault] as number | undefined) ?? 0,
      supportContact: (byKey[SETTINGS_KEYS.supportContact] as string | undefined) ?? "",
    };
  },
});

async function setSetting(ctx: MutationCtx, key: string, value: unknown) {
  const existing = await ctx.db
    .query("platformSettings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { value });
  } else {
    await ctx.db.insert("platformSettings", { key, value });
  }
}

export const updateMinWithdrawalAmount = mutation({
  args: {
    currency: v.union(
      v.literal("BTC"),
      v.literal("ETH"),
      v.literal("USDT"),
      v.literal("USDC"),
      v.literal("BNB"),
    ),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.amount < 0) throw new Error("Minimum withdrawal amount cannot be negative");

    const current = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEYS.minWithdrawalAmount))
      .unique();
    const before = (current?.value as Record<Currency, number> | undefined) ??
      defaultMinWithdrawalAmount();
    const after = { ...before, [args.currency]: args.amount };

    await setSetting(ctx, SETTINGS_KEYS.minWithdrawalAmount, after);
    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "update_min_withdrawal_amount",
      targetTable: "platformSettings",
      targetId: SETTINGS_KEYS.minWithdrawalAmount,
      before,
      after,
    });
  },
});

export const updateReferralCommissionRateDefault = mutation({
  args: { rate: v.number() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.rate < 0 || args.rate > 1) {
      throw new Error("Commission rate must be between 0 and 1");
    }
    await setSetting(ctx, SETTINGS_KEYS.referralCommissionRateDefault, args.rate);
    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "update_referral_commission_rate_default",
      targetTable: "platformSettings",
      targetId: SETTINGS_KEYS.referralCommissionRateDefault,
      after: { rate: args.rate },
    });
  },
});

export const updateSupportContact = mutation({
  args: { supportContact: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    await setSetting(ctx, SETTINGS_KEYS.supportContact, args.supportContact.trim());
    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "update_support_contact",
      targetTable: "platformSettings",
      targetId: SETTINGS_KEYS.supportContact,
      after: { supportContact: args.supportContact.trim() },
    });
  },
});
