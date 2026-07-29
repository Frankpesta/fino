# Phase 4 — Admin Panel

Single super-admin role for now (per your call) — but build permission checks as if more
admin roles could be added later, so it's not a rewrite if you introduce sub-admins.

## 4.1 Admin dashboard (`/admin`)
- Platform-wide stats: total users, total deposited (all-time + pending), total withdrawn,
  total currently invested across all plans, pending deposit/withdrawal counts (actionable
  queue front and center).
- Recent admin actions feed (from `adminAuditLog`).

## 4.2 Deposit management (`/admin/deposits`)
- Queue view defaulting to `status: pending`, with tabs for approved/rejected/all.
- Row expands to show proof upload / tx hash for verification.
- **Approve** action (one Convex mutation, admin-role-gated):
  1. Set `deposits.status = "approved"`, `reviewedBy`, `reviewedAt`.
  2. Write `transactions` row (`type: "deposit"`), increment user's `balances[currency]`.
  3. Write `adminAuditLog` row.
  4. Trigger "deposit approved" email (Phase 6).
  5. If the depositing user was referred, credit the referrer's commission here (Phase 5 logic
     hooks in at this exact point — deposit approval is the commission trigger, not signup).
- **Reject** action: requires `rejectionReason` input, sets status, logs, emails user.

## 4.3 Withdrawal management (`/admin/withdrawals`)
- Same queue pattern. **Approve**:
  1. Verify balance still covers it (re-check at approval time, not just at request time).
  2. Deduct balance, write `transactions` row (`type: "withdrawal"`).
  3. Admin manually sends the actual crypto payout externally, then pastes `payoutTxHash`
     into the record to close the loop (this system doesn't auto-broadcast on-chain
     transactions — that's a deliberate scope boundary; see note below).
  4. Log + email user.
- **Reject**: same pattern as deposits, funds were never deducted so nothing to reverse.

> **Scope note:** this build does not include an automated hot-wallet payout system (i.e.
> Convex code that itself signs and broadcasts crypto transactions). Admin approves in-app,
> then executes the payout through your own custody/wallet tooling and records the tx hash.
> Building automated on-chain payouts is a much larger, security-critical undertaking
> (key management, multi-sig, hot/cold wallet policy) that deserves its own dedicated spec —
> flag if you want that scoped separately.

## 4.4 User management (`/admin/users`)
- Searchable/sortable user table: email, balance, status, join date, referral count.
- User detail page: full transaction history, active investments, deposit/withdrawal history,
  manual balance adjustment (with mandatory `note`, logged to `adminAuditLog` as
  `admin_adjustment` — this is the one place manual ledger writes are allowed, and it should
  be rare/audited).
- Suspend / ban actions.

## 4.5 Investment plan management (`/admin/plans`)
- CRUD as described in Phase 3.4.

## 4.6 Platform settings (`/admin/settings`)
- `platformWallets` CRUD (the receiving addresses shown to users per currency).
- Site-wide config: min withdrawal amount, referral commission rate default, support contact.

## Deliverable checklist
- [ ] Every approve/reject action writes both a `transactions` row and an `adminAuditLog` row
      in the same mutation (atomic)
- [ ] Admin routes fully inaccessible to non-admin roles, server-side enforced
- [ ] Manual balance adjustments require a note and are visibly flagged in user's ledger
- [ ] Withdrawal approval re-validates balance at approval time, not just request time
