# Phase 7 — Polish, Animation, Security Hardening, Launch

## 7.1 Animation pass (GSAP + AnimeJS)
- **Marketing/landing pages**: GSAP ScrollTrigger for section reveals, hero stat counters
  animating on view, smooth scroll. Keep it purposeful — animation should draw attention to
  real numbers (plan rates, not fabricated "live earnings" tickers).
- **Dashboard micro-interactions**: AnimeJS for balance number transitions when values change
  (realtime Convex updates), status badge transitions (pending → approved), toast
  notifications, modal/drawer open-close easing.
- **Admin queue**: subtle row-removal animation when an item is approved/rejected so the queue
  visibly shrinks (satisfying feedback loop for repetitive admin work).
- Respect `prefers-reduced-motion` throughout — disable/simplify non-essential animation for
  users who request it.

## 7.2 Security hardening pass
- Re-audit every mutation that touches `balances` — confirm role checks + ownership checks
  (`userId === ctx.auth identity`) are server-side, not just hidden in the UI.
- Rate-limit auth endpoints (login attempts, verification code attempts, password reset).
- CSRF/session review if using cookie-based auth.
- File upload validation (proof-of-deposit images): file type/size limits, no executable
  uploads.
- Review admin audit log completeness — spot-check that every state-changing admin action
  actually produced a log row in staging.

## 7.3 QA checklist
- [ ] Full user journey: signup → verify → deposit → admin approve → invest in plan → accrual
      ticks → withdraw → admin approve → email received at each step
- [ ] Referral journey: signup via link → deposit → admin approve → referrer sees commission
- [ ] Dark/light mode parity across every page, including emails
- [ ] Mobile responsive pass on all dashboard + admin views
- [ ] Load test the accrual cron against a realistic number of active investments
- [ ] Legal/compliance copy review: risk disclosures present on plan pages, terms of service
      and privacy policy pages exist and are linked in footer + signup flow

## 7.4 Launch
- Environment separation: staging Convex deployment + staging Resend domain before touching
  production.
- Backup/export plan for the Convex database (regular snapshots).
- Monitoring: error tracking (e.g. Sentry) on both frontend and Convex functions; alert on
  cron job failures specifically, since a silently-failing accrual cron is a direct financial
  discrepancy.
- Soft launch to a small user cohort before full public marketing push, to validate the
  deposit → approval → payout loop with real (small) amounts first.
