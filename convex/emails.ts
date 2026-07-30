import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { deliverEmail } from "./model/email";
import { shouldSendNotification } from "../lib/notificationPreferences";
import { formatAmount } from "../lib/currency";
import { currencyValidator } from "./schema";
import { DepositSubmittedEmail } from "../emails/DepositSubmittedEmail";
import { DepositApprovedEmail } from "../emails/DepositApprovedEmail";
import { DepositRejectedEmail } from "../emails/DepositRejectedEmail";
import { WithdrawalSubmittedEmail } from "../emails/WithdrawalSubmittedEmail";
import { WithdrawalApprovedEmail } from "../emails/WithdrawalApprovedEmail";
import { WithdrawalRejectedEmail } from "../emails/WithdrawalRejectedEmail";
import { InvestmentStartedEmail } from "../emails/InvestmentStartedEmail";
import { InvestmentMaturedEmail } from "../emails/InvestmentMaturedEmail";
import { ReferralCommissionEmail } from "../emails/ReferralCommissionEmail";
import { SecurityNoticeEmail } from "../emails/SecurityNoticeEmail";
import { PasswordResetCodeEmail } from "../emails/PasswordResetCodeEmail";
import { CronFailureAlertEmail } from "../emails/CronFailureAlertEmail";
import { ContactMessageEmail } from "../emails/ContactMessageEmail";

// Deposit submitted has no preference toggle in the spec's list (only
// approved/rejected do) -- it always sends, same as the security-critical
// group, just for a different reason (it's the user's own just-taken action,
// not background account activity).
export const sendDepositSubmitted = internalAction({
  args: { userId: v.id("users"), amount: v.number(), currency: currencyValidator },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "We've received your deposit request",
      react: DepositSubmittedEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
      }),
      template: "deposit_submitted",
      userId: user._id,
    });
  },
});

export const sendDepositApproved = internalAction({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: currencyValidator,
    newBalance: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    if (!shouldSendNotification(user.notificationPreferences, "depositApproved")) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Your deposit has been approved",
      react: DepositApprovedEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
        newBalance: formatAmount(args.newBalance, args.currency),
      }),
      template: "deposit_approved",
      userId: user._id,
    });
  },
});

export const sendDepositRejected = internalAction({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: currencyValidator,
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    if (!shouldSendNotification(user.notificationPreferences, "depositRejected")) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Your deposit request was rejected",
      react: DepositRejectedEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
        reason: args.reason,
      }),
      template: "deposit_rejected",
      userId: user._id,
    });
  },
});

export const sendWithdrawalSubmitted = internalAction({
  args: { userId: v.id("users"), amount: v.number(), currency: currencyValidator },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Withdrawal request received",
      react: WithdrawalSubmittedEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
      }),
      template: "withdrawal_submitted",
      userId: user._id,
    });
  },
});

export const sendWithdrawalApproved = internalAction({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: currencyValidator,
    payoutTxHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    if (!shouldSendNotification(user.notificationPreferences, "withdrawalApproved")) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Your withdrawal has been approved",
      react: WithdrawalApprovedEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
        payoutTxHash: args.payoutTxHash,
      }),
      template: "withdrawal_approved",
      userId: user._id,
    });
  },
});

export const sendWithdrawalRejected = internalAction({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: currencyValidator,
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    if (!shouldSendNotification(user.notificationPreferences, "withdrawalRejected")) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Your withdrawal request was rejected",
      react: WithdrawalRejectedEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
        reason: args.reason,
      }),
      template: "withdrawal_rejected",
      userId: user._id,
    });
  },
});

export const sendInvestmentStarted = internalAction({
  args: {
    userId: v.id("users"),
    planName: v.string(),
    principal: v.number(),
    currency: currencyValidator,
    rate: v.number(),
    rateInterval: v.string(),
    endsAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: `You've invested in ${args.planName}`,
      react: InvestmentStartedEmail({
        planName: args.planName,
        principal: formatAmount(args.principal, args.currency),
        currency: args.currency,
        ratePercent: (args.rate * 100).toFixed(2),
        rateInterval: args.rateInterval.replace("ly", ""),
        endsAtDate: new Date(args.endsAt).toLocaleDateString(),
      }),
      template: "investment_started",
      userId: user._id,
    });
  },
});

export const sendInvestmentMatured = internalAction({
  args: {
    userId: v.id("users"),
    planName: v.string(),
    payoutAmount: v.number(),
    currency: currencyValidator,
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    if (!shouldSendNotification(user.notificationPreferences, "investmentMatured")) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: `Your investment in ${args.planName} has matured`,
      react: InvestmentMaturedEmail({
        planName: args.planName,
        payoutAmount: formatAmount(args.payoutAmount, args.currency),
        currency: args.currency,
      }),
      template: "investment_matured",
      userId: user._id,
    });
  },
});

export const sendReferralCommission = internalAction({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: currencyValidator,
    maskedReferredEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    if (!shouldSendNotification(user.notificationPreferences, "referralCommissionEarned")) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "You earned a referral commission",
      react: ReferralCommissionEmail({
        amount: formatAmount(args.amount, args.currency),
        currency: args.currency,
        maskedReferredEmail: args.maskedReferredEmail,
      }),
      template: "referral_commission",
      userId: user._id,
    });
  },
});

// Security-critical -- always sends, no preference check (see
// docs/07-phase-6-emails-notifications.md 6.3).
export const sendSecurityNotice = internalAction({
  args: { userId: v.id("users"), message: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Security notice for your account",
      react: SecurityNoticeEmail({ message: args.message }),
      template: "security_notice",
      userId: user._id,
    });
  },
});

// Security-critical -- always sends, no preference check.
export const sendPasswordResetCode = internalAction({
  args: { userId: v.id("users"), code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.profile.getUserInternal, { userId: args.userId });
    if (!user) return;
    await deliverEmail(ctx, {
      to: user.email,
      subject: "Reset your password",
      react: PasswordResetCodeEmail({ code: args.code }),
      template: "password_reset_code",
      userId: user._id,
    });
  },
});

// Notifies every admin when a cron run (accrual/finalization) skips one or
// more records -- a silent skip there is a direct financial discrepancy, not
// just a UX bug, so this always sends with no preference check and no
// per-user gating.
export const sendCronFailureAlert = internalAction({
  args: { cronName: v.string(), errorCount: v.number(), firstError: v.string() },
  handler: async (ctx, args) => {
    const admins = await ctx.runQuery(internal.users.listAdminsInternal, {});
    for (const admin of admins) {
      await deliverEmail(ctx, {
        to: admin.email,
        subject: `[Fino] Cron failure: ${args.cronName}`,
        react: CronFailureAlertEmail({
          cronName: args.cronName,
          errorCount: args.errorCount,
          firstError: args.firstError,
        }),
        template: "cron_failure_alert",
        userId: admin._id,
      });
    }
  },
});

// Notifies every admin of a new marketing-site "Contact us" submission.
// Looked up by id (rather than passed inline) so the scheduled action always
// reflects the stored row, not a snapshot of unvalidated action args.
export const sendContactMessageNotice = internalAction({
  args: { messageId: v.id("contactMessages") },
  handler: async (ctx, args) => {
    const contactMessage = await ctx.runQuery(internal.contact.getInternal, {
      messageId: args.messageId,
    });
    if (!contactMessage) return;

    const admins = await ctx.runQuery(internal.users.listAdminsInternal, {});
    for (const admin of admins) {
      await deliverEmail(ctx, {
        to: admin.email,
        subject: `[Fino] New contact message: ${contactMessage.subject}`,
        react: ContactMessageEmail({
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          message: contactMessage.message,
        }),
        template: "contact_message",
        userId: admin._id,
      });
    }
  },
});
