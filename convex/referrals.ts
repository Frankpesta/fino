import { requireVerifiedUser } from "./model/authz";
import { addMoney } from "../lib/money";
import { CURRENCIES, type Currency } from "../lib/currency";
import { maskEmail } from "../lib/maskEmail";
import { query } from "./_generated/server";

function zeroByCurrency(): Record<Currency, number> {
  return { BTC: 0, ETH: 0, USDT: 0, USDC: 0, BNB: 0 };
}

export const getMyReferralInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireVerifiedUser(ctx);

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrerId", (q) => q.eq("referrerId", user._id))
      .collect();

    const totalCommission = zeroByCurrency();
    const referredUsers = await Promise.all(
      referrals.map(async (referral) => {
        for (const currency of CURRENCIES) {
          totalCommission[currency] = addMoney(
            totalCommission[currency],
            referral.totalCommissionEarned[currency],
          );
        }

        const referredUser = await ctx.db.get(referral.referredUserId);
        const approvedDeposits = await ctx.db
          .query("deposits")
          .withIndex("by_userId", (q) => q.eq("userId", referral.referredUserId))
          .filter((q) => q.eq(q.field("status"), "approved"))
          .collect();

        const totalDeposited = zeroByCurrency();
        for (const deposit of approvedDeposits) {
          totalDeposited[deposit.currency] = addMoney(
            totalDeposited[deposit.currency],
            deposit.amount,
          );
        }

        return {
          referralId: referral._id,
          maskedEmail: referredUser ? maskEmail(referredUser.email) : "unknown",
          joinedAt: referredUser?.createdAt ?? referral.createdAt,
          commissionRate: referral.commissionRate,
          commissionEarned: referral.totalCommissionEarned,
          totalDeposited,
        };
      }),
    );

    return {
      referralCode: user.referralCode,
      totalLifetimeCommission: totalCommission,
      referredUsers: referredUsers.sort((a, b) => b.joinedAt - a.joinedAt),
    };
  },
});
