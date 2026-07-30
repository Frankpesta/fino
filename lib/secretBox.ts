// Small AES-GCM envelope for encrypting sensitive fields at rest (currently
// just the TOTP secret -- see convex/profile.ts). Web Crypto only, so it
// runs identically in the browser, Node (tests), and Convex's V8 isolate,
// same reasoning as lib/totp.ts.
//
// Output format: base64(iv) + "." + base64(ciphertext-with-auth-tag), so a
// single string column can hold it.

const KEY_ALGO = { name: "AES-GCM", length: 256 };
const IV_BYTES = 12; // 96-bit IV, the standard/recommended size for GCM

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBytes = fromBase64(keyBase64);
  if (keyBytes.length !== 32) {
    throw new Error(
      `secretBox key must be 32 bytes (256 bits) base64-encoded, got ${keyBytes.length} bytes`,
    );
  }
  return crypto.subtle.importKey("raw", keyBytes as Uint8Array<ArrayBuffer>, KEY_ALGO, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function generateSecretBoxKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64(bytes);
}

export async function encryptSecret(plaintext: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64);
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );

  return `${toBase64(iv)}.${toBase64(ciphertext)}`;
}

export async function decryptSecret(envelope: string, keyBase64: string): Promise<string> {
  const [ivB64, ciphertextB64] = envelope.split(".");
  if (!ivB64 || !ciphertextB64) {
    throw new Error("Malformed secretBox envelope");
  }

  const key = await importKey(keyBase64);
  const iv = fromBase64(ivB64);
  const ciphertext = fromBase64(ciphertextB64);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
    key,
    ciphertext as Uint8Array<ArrayBuffer>,
  );

  return new TextDecoder().decode(plaintext);
}
