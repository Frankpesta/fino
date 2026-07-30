import { describe, it, expect } from "vitest";
import { generateSecretBoxKey, encryptSecret, decryptSecret } from "./secretBox";

describe("secretBox", () => {
  it("round-trips a plaintext string", async () => {
    const key = generateSecretBoxKey();
    const envelope = await encryptSecret("JBSWY3DPEHPK3PXP", key);
    expect(await decryptSecret(envelope, key)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("produces a different envelope each time (random IV)", async () => {
    const key = generateSecretBoxKey();
    const a = await encryptSecret("same-plaintext", key);
    const b = await encryptSecret("same-plaintext", key);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with the wrong key", async () => {
    const key = generateSecretBoxKey();
    const wrongKey = generateSecretBoxKey();
    const envelope = await encryptSecret("secret-value", key);
    await expect(decryptSecret(envelope, wrongKey)).rejects.toThrow();
  });

  it("detects tampering with the ciphertext (GCM auth tag)", async () => {
    const key = generateSecretBoxKey();
    const envelope = await encryptSecret("secret-value", key);
    const [iv, ciphertext] = envelope.split(".");
    // Flip a character in the ciphertext to corrupt it.
    const tampered = `${iv}.${ciphertext.slice(0, -1)}${ciphertext.at(-1) === "A" ? "B" : "A"}`;
    await expect(decryptSecret(tampered, key)).rejects.toThrow();
  });

  it("rejects a key that isn't 32 bytes", async () => {
    await expect(encryptSecret("value", "dG9vc2hvcnQ=")).rejects.toThrow(/32 bytes/);
  });

  it("generates distinct keys each call", () => {
    expect(generateSecretBoxKey()).not.toBe(generateSecretBoxKey());
  });
});
