# Phase 1 — Foundations

**Goal:** a running app with auth, email verification, role-based routing, and the design
system in place. Nothing money-related yet.

## 1.1 Project setup
- `npx create-next-app@latest` (App Router, TypeScript, Tailwind)
- Install: `convex`, `zustand`, `resend`, `react-email`, `@react-email/components`,
  `animejs`, `gsap`, shadcn/ui CLI (`npx shadcn@latest init`)
- `npx convex dev` to scaffold backend; wire `ConvexProvider` in root layout
- Folder structure:
  ```
  app/
    (marketing)/            -> public landing pages
    (auth)/sign-in /sign-up /verify-email
    (user)/dashboard /deposits /withdrawals /profile /referrals
    (admin)/admin/...
  convex/
    schema.ts
    users.ts, deposits.ts, withdrawals.ts, plans.ts, referrals.ts, admin.ts
  emails/                   -> react-email templates
  components/ui/            -> shadcn components
  ```

## 1.2 Auth & roles
- Use Convex Auth (email/password) or Clerk if you want hosted auth UI — either works with
  Convex; pick one and keep `role: "user"|"admin"` in the `users` table as the source of truth
  (don't rely solely on the auth provider's metadata for authorization checks).
- Middleware: `(admin)` route group requires `role === "admin"`; `(user)` routes require any
  authenticated + `emailVerified === true` user; redirect unverified users to `/verify-email`.
- Every Convex mutation/query that touches money or admin data re-checks role server-side —
  never trust a client-side role check alone.

## 1.3 Email verification flow
1. On signup, create `users` row (`emailVerified: false`) + `emailVerifications` row with a
   6-digit code, 15-minute expiry.
2. Send verification email via Resend (template in Phase 6, stub with `console.log` until
   then).
3. `/verify-email` page: code input, "resend code" (rate-limited, e.g. 1/min).
4. On success: `emailVerified: true`, redirect to `/dashboard`.
5. Block all deposit/withdrawal mutations server-side if `emailVerified === false`, not just
   at the route level.

## 1.4 Design system (shadcn + dark/light)
- Define CSS variables for a distinct palette (not shadcn defaults) — pick 1 primary accent
  (e.g. a deep teal or electric indigo) + a neutral scale; keep dark mode as the default given
  the trading-platform genre, light mode as a full second theme, not an afterthought.
- Typography: a confident display face for headings (numbers/stats should feel substantial —
  tabular figures for all balance/amount displays), a clean sans for body.
- Build the shared primitives first: `StatCard`, `DataTable` (for deposit/withdrawal lists),
  `StatusBadge` (pending/approved/rejected color-coded), `CurrencyIcon`, `AmountDisplay`
  (handles decimal formatting per asset).
- Set up `next-themes` for dark/light toggle wired to shadcn's theme tokens.

## 1.5 Zustand usage
Keep Zustand scoped to **ephemeral UI state only** — sidebar collapsed state, active dashboard
tab, modal open/close, multi-step form progress (e.g. the deposit wizard). All persisted data
(balances, deposits, plans) comes from Convex's realtime `useQuery`, not Zustand — avoid
duplicating server state into a client store, which causes sync bugs.

## Deliverable checklist
- [ ] Signup → email verification → dashboard redirect works end to end
- [ ] Admin login redirects to `/admin`, user login to `/dashboard`
- [ ] Dark/light toggle persists across reload
- [ ] Shared UI primitives (`StatCard`, `DataTable`, `StatusBadge`, `AmountDisplay`) built and
      documented in a `/components/ui` storybook-style demo page (optional but recommended)
