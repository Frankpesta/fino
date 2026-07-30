import { describe, it, expect } from "vitest";
import { maskEmail } from "./maskEmail";

describe("maskEmail", () => {
  it("keeps the first 2 characters of a longer local part", () => {
    expect(maskEmail("johndoe@example.com")).toBe("jo***@example.com");
  });

  it("masks a short local part entirely (2 chars or fewer)", () => {
    expect(maskEmail("jo@example.com")).toBe("jo***@example.com");
    expect(maskEmail("j@example.com")).toBe("j***@example.com");
  });

  it("preserves the full domain", () => {
    expect(maskEmail("someone@sub.example.co.uk")).toBe("so***@sub.example.co.uk");
  });

  it("returns the input unchanged if it has no @", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});
