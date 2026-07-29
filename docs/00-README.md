# Crypto Trading Desk Platform — Build Plan

A phased build plan for a crypto investment platform where the company trades pooled user
funds across investment plans and pays out returns. Two roles: **User** and **Admin**.

Reference: layout/IA patterns loosely inspired by finovexus.com. **Copy, testimonials, and
numbers are original to this product** — nothing is copied from that site, since its stated
claims (fabricated reviews, unrealistic returns, unverifiable regulatory claims) are not
something we reuse. All marketing copy, disclosures, and returns language in this build must
reflect real terms.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (latest, App Router) |
| Styling | Tailwind CSS (latest) |
| Components | shadcn/ui (dark/light theme support) |
| State | Zustand (client-side UI state; Convex is source of truth for server state) |
| Backend | Convex (DB, realtime queries, cron jobs, file storage) |
| Auth | Convex Auth or Clerk (see 02-phase-1) + email verification |
| Email | Resend + react-email |
| Animation | AnimeJS + GSAP |
| Deployment | Vercel (frontend) + Convex Cloud (backend) |

## Non-Negotiables (carried through every phase)

1. **No seed-phrase / private-key collection, ever.** No "link wallet" UI that asks for a
   12/24-word phrase. If wallet connect is added later, it must use WalletConnect /
   sign-in-with-wallet where keys never leave the user's device.
2. **No fabricated social proof.** No fake testimonials, fake "earned today" tickers, or
   invented user counts. If social proof is wanted, it must come from real data or be omitted.
3. **ROI language must not overpromise.** Plans show a rate (per your call: fixed 5%/week
   style rates), but UI copy uses "target rate" / "current plan rate" rather than "guaranteed,"
   and every plan page carries a risk disclosure.
4. **All money-moving actions require an admin approval step.** No deposit or withdrawal is
   auto-approved without an explicit admin action, logged with an audit trail.
5. **Every financial mutation is logged** (who, what, when, before/after balance) — this is
   the backbone of both trust and dispute resolution.

## Phase Index

| Phase | File | Covers |
|---|---|---|
| 0 | `00-README.md` | This file |
| 1 | `01-data-model.md` | Convex schema for the whole system |
| 2 | `02-phase-1-foundations.md` | Repo setup, auth, email verification, design system |
| 3 | `03-phase-2-user-dashboard.md` | Dashboard home, deposits, withdrawals |
| 4 | `04-phase-3-investment-plans.md` | Plans, investing flow, ROI accrual engine |
| 5 | `05-phase-4-admin-panel.md` | Admin oversight of everything |
| 6 | `06-phase-5-referrals-profile.md` | Referral program, profile/security settings |
| 7 | `07-phase-6-emails-notifications.md` | Transactional email system |
| 8 | `08-phase-7-polish-launch.md` | Animation pass, QA, security hardening, launch |

## Suggested Sequencing

Phases 1–2 are strictly sequential (nothing works without schema + auth). From Phase 3 onward,
user-facing deposit/withdrawal UI and admin approval UI should be built **together** — an admin
review queue with nothing to review, or a user deposit flow with no admin able to approve it,
is dead weight either direction. Phase 4 (plans) can start in parallel with Phase 3 once the
schema is in place. Emails (Phase 6) should be stubbed early (console-logged) and wired to
Resend for real once templates exist, so verification/deposit flows aren't blocked waiting on
email design.
