import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/**
 * Server-side authorization helpers. Every mutation/query touching money or
 * admin data must go through one of these -- a client-side role check alone
 * is never sufficient (per docs/00-README.md non-negotiable #4/#5 and
 * docs/02-phase-1-foundations.md 1.2).
 */

export class AuthzError extends Error {}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new AuthzError("Not authenticated");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new AuthzError("User record not found");
  }
  return user;
}

export async function requireVerifiedUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!user.emailVerified) {
    throw new AuthzError("Email not verified");
  }
  if (user.status !== "active") {
    throw new AuthzError(`Account is ${user.status}`);
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin") {
    throw new AuthzError("Admin role required");
  }
  if (user.status !== "active") {
    throw new AuthzError(`Admin account is ${user.status}`);
  }
  return user;
}
