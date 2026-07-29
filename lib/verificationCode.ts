export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000; // 1/min

export function generateVerificationCode(random: () => number = Math.random): string {
  return Math.floor(100000 + random() * 900000).toString();
}

export function isExpired(expiresAt: number, now: number): boolean {
  return now >= expiresAt;
}

export function canResend(lastSentAt: number, now: number): boolean {
  return now - lastSentAt >= VERIFICATION_RESEND_COOLDOWN_MS;
}
