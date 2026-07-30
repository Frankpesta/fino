import { encryptSecret, decryptSecret } from "../../lib/secretBox";

function getTotpEncryptionKey(): string {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY is not configured -- run `npx convex env set TOTP_ENCRYPTION_KEY <32-byte base64 key>`",
    );
  }
  return key;
}

export async function encryptTotpSecret(plaintext: string): Promise<string> {
  return encryptSecret(plaintext, getTotpEncryptionKey());
}

export async function decryptTotpSecret(envelope: string): Promise<string> {
  return decryptSecret(envelope, getTotpEncryptionKey());
}
