# Phase 6 — Emails & Notifications

## 6.1 Setup
- `react-email` templates under `/emails`, rendered and sent via `Resend`'s SDK from Convex
  actions (Convex actions can call external APIs; mutations cannot — so email-sending is
  always an `action`, triggered from a mutation via `ctx.scheduler.runAfter(0, ...)`).
- One shared `EmailLayout` component (logo, footer, unsubscribe/preferences link) wrapping
  every template for visual consistency with the dashboard's design system.

## 6.2 Template list
| Trigger | Template |
|---|---|
| Signup | Email verification code |
| Verification success | Welcome email |
| Deposit submitted | "We've received your deposit request" |
| Deposit approved | Confirmation + new balance |
| Deposit rejected | Reason + support contact |
| Withdrawal submitted | "Withdrawal request received" |
| Withdrawal approved | Confirmation + tx hash if available |
| Withdrawal rejected | Reason + support contact |
| Investment started | Plan summary + term end date |
| Investment matured | Payout summary |
| Referral commission earned | Amount + referred user (masked) |
| Password changed / 2FA changed | Security notice |
| Admin: new pending deposit/withdrawal (optional) | Internal ops alert |

## 6.3 Delivery logic
- Respect the per-event notification preferences from Phase 5.2 before sending (except
  security-critical emails — verification, password/2FA changes — which always send).
- Log every send attempt (success/failure) to a lightweight `emailLog` table for debugging
  delivery issues, rather than relying solely on Resend's dashboard.
- Rate-limit resend-triggered emails (verification code resend, password reset) server-side.

## Deliverable checklist
- [ ] All templates render correctly in light/dark email clients (test via Resend preview)
- [ ] Every money-state-change action in Phases 2–4 has its corresponding email wired in
- [ ] Notification preference toggles are respected
- [ ] Failed sends are logged and don't silently disappear
