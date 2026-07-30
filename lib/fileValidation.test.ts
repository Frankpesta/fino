import { describe, it, expect } from "vitest";
import { validateProofUpload, MAX_PROOF_FILE_BYTES } from "./fileValidation";

describe("validateProofUpload", () => {
  it("accepts a valid PNG under the size limit", () => {
    expect(() => validateProofUpload({ contentType: "image/png", size: 1024 })).not.toThrow();
  });

  it("accepts JPEG and WebP too", () => {
    expect(() => validateProofUpload({ contentType: "image/jpeg", size: 1024 })).not.toThrow();
    expect(() => validateProofUpload({ contentType: "image/webp", size: 1024 })).not.toThrow();
  });

  it("rejects a missing content type", () => {
    expect(() => validateProofUpload({ size: 1024 })).toThrow(/PNG, JPEG, or WebP/);
  });

  it("rejects a non-image content type (e.g. a disguised executable/script)", () => {
    expect(() =>
      validateProofUpload({ contentType: "application/x-sh", size: 1024 }),
    ).toThrow(/PNG, JPEG, or WebP/);
    expect(() =>
      validateProofUpload({ contentType: "application/pdf", size: 1024 }),
    ).toThrow(/PNG, JPEG, or WebP/);
  });

  it("accepts a file exactly at the size limit", () => {
    expect(() =>
      validateProofUpload({ contentType: "image/png", size: MAX_PROOF_FILE_BYTES }),
    ).not.toThrow();
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      validateProofUpload({ contentType: "image/png", size: MAX_PROOF_FILE_BYTES + 1 }),
    ).toThrow(/too large/i);
  });
});
