# Phase 3 — Investment Plans & ROI Accrual

## 3.1 Plans listing (`/dashboard/plans` or part of dashboard)
- Cards per active `investmentPlans` row: name, rate + interval (e.g. "5% / week"), min/max
  deposit, duration, short description.
- Copy pattern: show the rate as **"Target rate"** not "Guaranteed return," with a one-line
  risk disclosure visible on every plan card (e.g. "Returns are not guaranteed and depend on
  trading performance."). This keeps the product honest without needing to change your
  business terms.
- "Invest" CTA opens a flow: pick amount (validated against available balance + plan min/max)
  → confirm → creates an `investments` row, decrements available balance via a `transactions`
  write (`type: "investment"`).

## 3.2 Accrual engine (Convex cron)
- A scheduled Convex cron (`crons.ts`) runs on the plan's `rateInterval` cadence (e.g. daily
  job that checks which plans/investments are due for accrual today).
- For each `active` investment due for accrual:
  1. Compute accrual amount = `principal * plan.rate` (or pro-rated daily if `rateInterval`
     is weekly/monthly but you want daily visual ticking — decide once and be consistent).
  2. Write a `transactions` row (`type: "payout"`), update `investments.totalAccrued` and
     `lastAccrualAt`.
  3. If `payoutStyle === "accrual"`, credit the amount to the user's available balance
     immediately; if `"end_of_term"`, only credit principal + total accrued when
     `endsAt` is reached.
- A second cron sweeps `investments` where `endsAt <= now` and `status === "active"`,
  finalizes them (`status: "completed"`), and triggers the end-of-term payout if applicable.
- **Idempotency**: guard each cron run so a re-trigger doesn't double-pay (check
  `lastAccrualAt` against the expected interval before writing).

## 3.3 Investment detail view
- Per-investment page: principal, plan, progress bar toward `endsAt`, accrual history
  (from `transactions` filtered by `relatedId === investmentId`), projected total at term end.

## 3.4 Admin side (ties into Phase 4)
- Admin CRUD for `investmentPlans`: create/edit/deactivate plans, adjust rate for *new*
  investments (existing active investments keep the rate they started at unless you explicitly
  want live-adjustable rates — recommend locking rate at investment time for trust/audit
  reasons).

## Deliverable checklist
- [ ] Plan cards render with target-rate framing + disclosure
- [ ] Investing in a plan correctly locks funds and logs a ledger entry
- [ ] Cron accrual runs on schedule, is idempotent, and produces correct `transactions` rows
- [ ] End-of-term payout finalizes investments and updates balance correctly
