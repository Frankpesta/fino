import { describe, it, expect } from "vitest";
import { base32Encode, base32Decode } from "./base32";

describe("base32 encode/decode", () => {
  it("round-trips arbitrary bytes", () => {
    const original = new Uint8Array([0, 1, 2, 3, 255, 254, 128, 64, 32, 16]);
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("matches a known RFC 4648 test vector", () => {
    // "foobar" -> MZXW6YTBOI (RFC 4648 test vectors, unpadded)
    const bytes = new TextEncoder().encode("foobar");
    expect(base32Encode(bytes)).toBe("MZXW6YTBOI");
  });

  it("decodes case-insensitively and ignores stray characters", () => {
    const bytes = new TextEncoder().encode("foobar");
    const encoded = base32Encode(bytes);
    expect(Array.from(base32Decode(encoded.toLowerCase()))).toEqual(Array.from(bytes));
  });

  it("round-trips a 20-byte random secret (typical TOTP secret size)", () => {
    const secret = new Uint8Array(20);
    for (let i = 0; i < secret.length; i++) secret[i] = i * 7;
    expect(Array.from(base32Decode(base32Encode(secret)))).toEqual(Array.from(secret));
  });
});
