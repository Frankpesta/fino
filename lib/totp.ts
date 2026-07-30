import { base32Decode, base32Encode } from "./base32";

// RFC 6238 TOTP over Web Crypto (crypto.subtle) rather than the `otpauth`
// npm package -- avoids any uncertainty about whether that package's crypto
// usage is compatible with Convex's V8-isolate runtime for
// queries/mutations. Web Crypto is available identically in the browser,
// Node (tests), and Convex's isolate, so this runs the same everywhere and
// needs no "use node" action.
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;
const SECRET_BYTES = 20; // 160-bit, the standard size for SHA1 TOTP secrets

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(SECRET_BYTES);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function generateTotpUri(params: {
  secretBase32: string;
  accountName: string;
  issuer: string;
}): string {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secretBase32,
    issuer: params.issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}

async function hotp(secretBase32: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secretBase32);
  const key = await crypto.subtle.importKey(
    "raw",
    // `keyBytes` is always backed by a plain ArrayBuffer (constructed from a
    // number[] in base32Decode, never a SharedArrayBuffer) -- TS's stricter
    // BufferSource overloads just can't infer that generically.
    keyBytes as Uint8Array<ArrayBuffer>,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  // Counter is time-in-seconds / 30 -- stays well within Number precision
  // for millennia, so a plain split across the two 32-bit halves is fine.
  view.setUint32(0, Math.floor(counter / 2 ** 32), false);
  view.setUint32(4, counter >>> 0, false);

  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes));
  const offset = signature[signature.length - 1] & 0xf;
  const binCode =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  return (binCode % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

function counterForTime(timeMs: number): number {
  return Math.floor(timeMs / 1000 / TOTP_PERIOD_SECONDS);
}

export async function computeTotp(
  secretBase32: string,
  forTimeMs: number = Date.now(),
): Promise<string> {
  return hotp(secretBase32, counterForTime(forTimeMs));
}

/**
 * Verifies a token against a +/-`window` step tolerance (default 1 step =
 * +/-30s) to absorb clock drift between the server and the user's
 * authenticator app.
 */
export async function verifyTotp(
  secretBase32: string,
  token: string,
  options: { window?: number; forTimeMs?: number } = {},
): Promise<boolean> {
  const window = options.window ?? 1;
  const counter = counterForTime(options.forTimeMs ?? Date.now());

  for (let step = -window; step <= window; step++) {
    if ((await hotp(secretBase32, counter + step)) === token) return true;
  }
  return false;
}
