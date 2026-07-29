# Phase 5 — Referrals & Profile

## 5.1 Referral program (`/referrals`)
- Each user has a unique `referralCode` (generated at signup) and a shareable link
  (`yoursite.com/sign-up?ref=CODE`).
- Signup flow reads `?ref=` param, sets `users.referredBy`, creates a `referrals` row with a
  default `commissionRate` (from platform settings, editable per-referral by admin if needed).
- **Commission triggers on deposit approval, not signup** — referring someone who never
  deposits shouldn't pay out (ties into Phase 4.2 step 5).
- Referral dashboard shows: your code/link, list of referred users (name/email masked
  appropriately, join date, their total deposits, your commission earned per referral),
  total lifetime commission.
- Commission itself is credited as a `transactions` row (`type: "referral_commission"`) into
  the referrer's balance, immediately available (not locked).

## 5.2 Profile (`/profile`)
- Basic info: name, email (read-only or re-verification-gated if changed), avatar.
- Security: change password, 2FA setup (TOTP — authenticator app, shown as QR via a library
  like `otpauth` + `qrcode`), active sessions list with "revoke" option.
- Notification preferences: email on deposit approved/rejected, withdrawal approved/rejected,
  investment matured, referral commission earned — toggle-able per event type.
- Danger zone: request account deletion (soft — flag for admin review, don't hard-delete
  financial records).

## Deliverable checklist
- [ ] Referral link correctly attributes signups
- [ ] Commission only pays out on the referred user's deposit approval, correct rate applied
- [ ] 2FA setup/verify/disable flow works
- [ ] Notification preference toggles actually gate which emails get sent (ties to Phase 6)
