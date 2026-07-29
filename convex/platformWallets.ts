import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { currencyValidator } from "./schema";

// Receiving addresses shown to users when they make a deposit. There is
// deliberately no seed data here -- these must be real addresses the
// platform actually controls custody of. Fabricating a placeholder address
// would be actively dangerous: a user could send real funds to it. Manage
// real values via /admin/settings, or the CLI as the promoted admin user:
//   npx convex run platformWallets:upsert \
//     '{"currency":"USDT","address":"<real address>","network":"TRC20","isActive":true}' \
//     --identity '{"subject":"<admin users._id>"}'
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireVerifiedUser(ctx);
    return await ctx.db
      .query("platformWallets")
      .withIndex("by_currency")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("platformWallets").withIndex("by_currency").collect();
  },
});

export const upsert = mutation({
  args: {
    currency: currencyValidator,
    address: v.string(),
    network: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("platformWallets")
      .withIndex("by_currency", (q) => q.eq("currency", args.currency))
      .unique();

    let walletId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        address: args.address,
        network: args.network,
        isActive: args.isActive,
      });
      walletId = existing._id;
    } else {
      walletId = await ctx.db.insert("platformWallets", args);
    }

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: existing ? "update_platform_wallet" : "create_platform_wallet",
      targetTable: "platformWallets",
      targetId: walletId,
      before: existing
        ? { address: existing.address, network: existing.network, isActive: existing.isActive }
        : undefined,
      after: { address: args.address, network: args.network, isActive: args.isActive },
    });

    return walletId;
  },
});
