import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireVerifiedUser } from "./model/authz";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    return await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 10);
  },
});
