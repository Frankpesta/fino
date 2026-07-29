import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { currencyValidator } from "./schema";

// Receiving addresses shown to users when they make a deposit. There is
// deliberately no seed data here -- these must be real addresses the
// platform actually controls custody of. Fabricating a placeholder address
// would be actively dangerous: a user could send real funds to it.
//
// Until the Phase 4 admin UI exists, set these via the CLI as the promoted
// admin user (find their `users._id` in the Convex dashboard Data tab):
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

export const upsert = mutation({
  args: {
    currency: currencyValidator,
    address: v.string(),
    network: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("platformWallets")
      .withIndex("by_currency", (q) => q.eq("currency", args.currency))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        address: args.address,
        network: args.network,
        isActive: args.isActive,
      });
      return existing._id;
    }

    return await ctx.db.insert("platformWallets", args);
  },
});
