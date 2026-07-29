# Phase 2 — User Dashboard, Deposits, Withdrawals

## 2.1 Dashboard home (`/dashboard`)
- Top stat row: total balance (aggregate + per-asset breakdown), active investments value,
  total earned (lifetime accrual), pending deposit/withdrawal count.
- Recent activity feed (last N `transactions`, realtime via `useQuery`).
- Quick actions: "Make a deposit", "Request withdrawal", "View plans".
- Active investments summary card (links to Phase 3 plan detail).
- All figures come straight from the `users.balances` + `transactions` Convex queries — no
  client-side computed "estimated" numbers that could drift from the ledger.

## 2.2 Deposits (`/deposits`)
Sub-views, all reading from the same `deposits` table filtered by `userId` + `status`:

- **Make a deposit** (`/deposits/new`): select currency → show the platform's receiving wallet
  address for that asset (address itself lives in a simple admin-editable config table or the
  `investmentPlans`-adjacent `settings` table — add a `platformWallets` table: `{currency,
  address, network, isActive}`) → user enters amount + optional tx hash → optional proof
  upload (`proofFileId` via Convex file storage) → submit creates a `deposits` row with
  `status: "pending"`.
- **Pending deposits**: list with status badge, submitted date, "cancel" action if still
  pending (soft-cancel, doesn't delete row — sets a `cancelled` status if you add one, or keep
  it simple and disallow cancellation, admin's call).
- **Approved deposits**: read-only list; approving is what triggers the `transactions` write
  and balance increment (done in Phase 4, admin side).
- **Rejected deposits**: shows `rejectionReason` so the user knows why.
- **All deposits**: combined table with filter/sort by status, date, currency, amount.

## 2.3 Withdrawals (`/withdrawals`)
Mirrors deposits structurally:

- **Make a withdrawal** (`/withdrawals/new`): select currency, amount (validate against
  available balance — available balance must exclude funds locked in active investments),
  destination address, optional note. Creates `withdrawals` row `status: "pending"`. **Do not
  decrement balance yet** — only reserve/hold it (add a `heldForWithdrawal` computed check so
  users can't request two withdrawals that double-spend the same balance) until admin approves,
  at which point the ledger mutation actually deducts it.
- **Pending / Approved / Rejected / All withdrawals**: same table pattern as deposits.

## 2.4 Shared table UX
- One `DataTable` component (from Phase 1) parameterized by column set + Convex query, reused
  across all 8 list views (4 deposit + 4 withdrawal) rather than 8 bespoke components.
- Empty states per tab ("No pending deposits yet — make your first deposit").
- Currency + amount always rendered through `AmountDisplay` for consistent decimal formatting.

## Deliverable checklist
- [ ] Deposit creation flow works, shows correct receiving address per currency
- [ ] Withdrawal creation validates against available (non-held, non-invested) balance
- [ ] All 8 list views (4+4) render correctly filtered, realtime-updating via Convex
- [ ] Balance never changes on submission — only on admin approval (verified via ledger check)
