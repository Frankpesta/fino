import { v } from "convex/values";
import { internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { validateContactMessage } from "../lib/contactMessage";

// Public, unauthenticated -- this is the marketing site's "Contact us" form.
// `company` is a honeypot: real users never see or fill this field (hidden
// via CSS in the form), so a filled value means a bot. We report success
// without storing or emailing anything, same enumeration-safe shape used by
// convex/passwordReset.ts, so a bot gets no signal that it was caught.
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.company && args.company.trim().length > 0) {
      return { success: true };
    }

    validateContactMessage(args);

    const messageId = await ctx.db.insert("contactMessages", {
      name: args.name.trim(),
      email: args.email.trim(),
      subject: args.subject.trim(),
      message: args.message.trim(),
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendContactMessageNotice, {
      messageId,
    });

    return { success: true };
  },
});

export const getInternal = internalQuery({
  args: { messageId: v.id("contactMessages") },
  handler: async (ctx, args) => await ctx.db.get(args.messageId),
});
