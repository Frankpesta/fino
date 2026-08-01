import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./model/authz";
import { logAdminAction } from "./model/audit";
import { validateAdminMessage } from "../lib/adminMessage";

const MAX_RESULTS = 50;

// Non-admin users only -- this is the recipient pool for both the
// single-user picker and the "all users" broadcast, so admins never
// accidentally email each other through this tool.
export const listRecipients = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "user"))
      .collect();

    const term = args.search?.trim().toLowerCase();
    const filtered = term
      ? users.filter(
          (u) => u.email.toLowerCase().includes(term) || (u.name?.toLowerCase().includes(term) ?? false),
        )
      : users;

    return filtered
      .slice(0, MAX_RESULTS)
      .map((u) => ({ _id: u._id, email: u.email, name: u.name }));
  },
});

export const recipientCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "user"))
      .collect();
    return users.length;
  },
});

export const sendToUser = mutation({
  args: { userId: v.id("users"), subject: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    validateAdminMessage(args);

    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (target.role === "admin") {
      throw new Error("Cannot message an admin account through this tool");
    }

    const subject = args.subject.trim();
    await ctx.scheduler.runAfter(0, internal.emails.sendAdminMessage, {
      userId: target._id,
      subject,
      message: args.message.trim(),
    });

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "send_admin_message",
      targetTable: "users",
      targetId: target._id,
      after: { subject, recipientCount: 1 },
    });

    return { recipientCount: 1 };
  },
});

export const broadcastToAllUsers = mutation({
  args: { subject: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    validateAdminMessage(args);

    const recipients = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "user"))
      .collect();

    const subject = args.subject.trim();
    const message = args.message.trim();
    for (const recipient of recipients) {
      await ctx.scheduler.runAfter(0, internal.emails.sendAdminMessage, {
        userId: recipient._id,
        subject,
        message,
      });
    }

    await logAdminAction(ctx, {
      adminId: admin._id,
      action: "broadcast_admin_message",
      targetTable: "users",
      targetId: "all",
      after: { subject, recipientCount: recipients.length },
    });

    return { recipientCount: recipients.length };
  },
});
