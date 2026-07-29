import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Every state-changing admin mutation writes one of these, in the same
 * mutation as the actual change (Convex mutations are transactional, so this
 * can never drift from the change it's logging). See
 * docs/05-phase-4-admin-panel.md deliverable checklist: "Every approve/
 * reject action writes both a transactions row and an adminAuditLog row in
 * the same mutation (atomic)."
 */
export async function logAdminAction(
  ctx: MutationCtx,
  args: {
    adminId: Id<"users">;
    action: string;
    targetTable: string;
    targetId: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await ctx.db.insert("adminAuditLog", {
    adminId: args.adminId,
    action: args.action,
    targetTable: args.targetTable,
    targetId: args.targetId,
    before: args.before,
    after: args.after,
    createdAt: Date.now(),
  });
}
