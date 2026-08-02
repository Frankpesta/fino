import type { ReactElement } from "react";
import { Resend } from "resend";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// Placeholder-but-real domain, matching the rest of this build's approach to
// unconfigured real-venture details (see docs note on real-venture
// placeholders): swap once a sending domain is verified with Resend.
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "Zypherex <notifications@updates.zypherex.com>";

/**
 * Shared send path for every transactional email. Resend's SDK renders the
 * `react` element itself (no separate @react-email/render call needed).
 *
 * Stays a console.log stub -- same pattern as Phase 1's email verification
 * stub -- until RESEND_API_KEY is configured
 * (`npx convex env set RESEND_API_KEY ...`), so nothing breaks in dev
 * without a real Resend account.
 *
 * Never throws: a failed send must not fail the money mutation/action that
 * triggered it (which already committed by the time this scheduled action
 * runs anyway). Failures are logged to `emailLog` instead of disappearing
 * silently -- see docs/07-phase-6-emails-notifications.md 6.3.
 */
export async function deliverEmail(
  ctx: ActionCtx,
  args: {
    to: string;
    subject: string;
    react: ReactElement;
    template: string;
    userId?: Id<"users">;
  },
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[email:${args.template}] to=${args.to} subject="${args.subject}" (RESEND_API_KEY not set, not sent)`,
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: args.to,
      subject: args.subject,
      react: args.react,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }

    await ctx.runMutation(internal.emailLog.logAttempt, {
      userId: args.userId,
      to: args.to,
      template: args.template,
      status: "sent",
    });
  } catch (err) {
    await ctx.runMutation(internal.emailLog.logAttempt, {
      userId: args.userId,
      to: args.to,
      template: args.template,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
