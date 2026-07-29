import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireVerifiedUser } from "./model/authz";
import { currencyValidator } from "./schema";

const depositStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled"),
);

export const listMine = query({
  args: { status: v.optional(depositStatusValidator) },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const deposits = await ctx.db
      .query("deposits")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return args.status ? deposits.filter((d) => d.status === args.status) : deposits;
  },
});

// Creates a pending deposit request. Never touches `users.balances` -- that
// only happens when an admin approves it (Phase 4). The receiving address is
// looked up server-side from `platformWallets`, never trusted from the
// client, so a compromised client can't record a bogus destination.
export const create = mutation({
  args: {
    amount: v.number(),
    currency: currencyValidator,
    txHash: v.optional(v.string()),
    proofFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const wallet = await ctx.db
      .query("platformWallets")
      .withIndex("by_currency", (q) => q.eq("currency", args.currency))
      .unique();

    if (!wallet || !wallet.isActive) {
      throw new Error(`No active deposit address configured for ${args.currency} yet`);
    }

    return await ctx.db.insert("deposits", {
      userId: user._id,
      amount: args.amount,
      currency: args.currency,
      destinationWalletAddress: wallet.address,
      proofFileId: args.proofFileId,
      txHash: args.txHash,
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      createdAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    const user = await requireVerifiedUser(ctx);
    const deposit = await ctx.db.get(args.depositId);

    if (!deposit || deposit.userId !== user._id) {
      throw new Error("Deposit not found");
    }
    if (deposit.status !== "pending") {
      throw new Error(`Cannot cancel a deposit that is already ${deposit.status}`);
    }

    await ctx.db.patch(args.depositId, { status: "cancelled" });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireVerifiedUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
