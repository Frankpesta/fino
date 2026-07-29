import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { addMoney, subtractMoney } from "../../lib/money";

/**
 * Sum of a user's still-pending withdrawal requests for a currency -- funds
 * reserved but not yet deducted from `users.balances` (deduction only
 * happens on admin approval, Phase 4). See
 * docs/03-phase-2-user-dashboard.md 2.3.
 */
export async function heldForWithdrawal(
  ctx: QueryCtx,
  userId: Id<"users">,
  currency: Doc<"withdrawals">["currency"],
) {
  const pending = await ctx.db
    .query("withdrawals")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "pending"))
    .collect();
  return pending
    .filter((w) => w.currency === currency)
    .reduce((sum, w) => addMoney(sum, w.amount), 0);
}

/**
 * Balance actually free to spend right now: raw balance minus whatever's
 * reserved by pending withdrawal requests. Used by both the withdrawal
 * creation flow and the invest flow -- investing must respect the same hold
 * so a user can't both withdraw and invest the same funds at once.
 */
export async function getAvailableBalance(
  ctx: QueryCtx,
  user: Doc<"users">,
  currency: Doc<"withdrawals">["currency"],
) {
  const held = await heldForWithdrawal(ctx, user._id, currency);
  return subtractMoney(user.balances[currency], held);
}
