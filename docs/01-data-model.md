# Data Model — Convex Schema

All tables below are written as `defineTable(...)` shapes for `convex/schema.ts`. Field types
are illustrative; adjust to Convex's `v.*` validators when implementing.

## `users`
```
{
  clerkId / authId: string,          // link to auth provider
  email: string,
  emailVerified: boolean,
  name: string,
  role: "user" | "admin",
  status: "active" | "suspended" | "banned",
  referredBy: Id<"users"> | null,
  referralCode: string,              // unique, generated on signup
  balances: {                        // per-asset available balance
    BTC: number, ETH: number, USDT: number, USDC: number, BNB: number
  },
  twoFactorEnabled: boolean,
  createdAt: number,
  lastLoginAt: number,
}
```
Index: `by_email`, `by_referralCode`, `by_role`.

## `emailVerifications`
```
{
  userId: Id<"users">,
  code: string,          // 6-digit or token
  expiresAt: number,
  consumedAt: number | null,
}
```
Index: `by_userId`, `by_code`.

## `investmentPlans` (admin-managed)
```
{
  name: string,
  description: string,
  minDeposit: number,
  maxDeposit: number | null,
  currency: "BTC"|"ETH"|"USDT"|"USDC"|"BNB"|"ANY",
  rate: number,                  // e.g. 0.05
  rateInterval: "daily"|"weekly"|"monthly",
  durationDays: number,          // plan term length
  payoutStyle: "accrual"|"end_of_term",
  isActive: boolean,
  sortOrder: number,
  createdBy: Id<"users">,
  createdAt: number,
}
```

## `investments` (a user's active/completed stake in a plan)
```
{
  userId: Id<"users">,
  planId: Id<"investmentPlans">,
  principal: number,
  currency: string,
  status: "active" | "completed" | "cancelled",
  startedAt: number,
  endsAt: number,
  totalAccrued: number,
  lastAccrualAt: number,
}
```
Index: `by_userId`, `by_status`, `by_endsAt` (for cron sweep).

## `deposits`
```
{
  userId: Id<"users">,
  amount: number,
  currency: string,
  destinationWalletAddress: string,   // company wallet shown to user
  proofFileId: Id<"_storage"> | null, // uploaded tx screenshot / hash
  txHash: string | null,
  status: "pending" | "approved" | "rejected",
  reviewedBy: Id<"users"> | null,
  reviewedAt: number | null,
  rejectionReason: string | null,
  createdAt: number,
}
```
Index: `by_userId`, `by_status`.

## `withdrawals`
```
{
  userId: Id<"users">,
  amount: number,
  currency: string,
  destinationAddress: string,   // user-supplied payout address
  status: "pending" | "approved" | "rejected",
  reviewedBy: Id<"users"> | null,
  reviewedAt: number | null,
  rejectionReason: string | null,
  payoutTxHash: string | null,
  createdAt: number,
}
```
Index: `by_userId`, `by_status`.

## `transactions` (immutable ledger — the audit trail)
```
{
  userId: Id<"users">,
  type: "deposit"|"withdrawal"|"investment"|"payout"|"referral_commission"|"admin_adjustment",
  amount: number,
  currency: string,
  balanceBefore: number,
  balanceAfter: number,
  relatedId: string | null,     // depositId / withdrawalId / investmentId
  performedBy: Id<"users">,     // system, admin, or the user themself
  note: string | null,
  createdAt: number,
}
```
Index: `by_userId`, `by_type`.

## `referrals`
```
{
  referrerId: Id<"users">,
  referredUserId: Id<"users">,
  commissionRate: number,          // e.g. 0.05 of referred user's deposits
  totalCommissionEarned: number,
  createdAt: number,
}
```

## `adminAuditLog`
```
{
  adminId: Id<"users">,
  action: string,             // "approve_deposit", "edit_plan", "suspend_user", ...
  targetTable: string,
  targetId: string,
  before: any,
  after: any,
  createdAt: number,
}
```

## `notifications` (in-app)
```
{
  userId: Id<"users">,
  title: string,
  body: string,
  type: string,
  read: boolean,
  createdAt: number,
}
```

## Design notes

- **Balances live on `users`, mutated only through `transactions` writes inside the same Convex
  mutation** — never update a balance without writing the corresponding ledger row.
- Deposits/withdrawals never directly touch `balances`; approval mutations do, and only after
  status flips to `approved`.
- `investments.totalAccrued` is updated by a Convex **cron job** (see Phase 3) rather than
  computed on read, so displayed values are stable and auditable.
- All money fields stored as numbers at the asset's native precision — decide a fixed decimal
  convention per asset (e.g. store USDT/USDC in cents-equivalent smallest unit) before writing
  any mutation, to avoid float drift.
