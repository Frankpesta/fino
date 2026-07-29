// Excludes visually ambiguous characters (0/O, 1/I/L) so codes are easy to
// read aloud or retype from a screenshot.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_LENGTH = 8;

export function generateReferralCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return code;
}

export function isValidReferralCodeFormat(code: string): boolean {
  if (code.length !== REFERRAL_CODE_LENGTH) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}
