// Pure validation logic for proof-of-deposit uploads, kept separate from
// convex/deposits.ts so it's directly unit-testable -- convex-test's
// in-memory storage mock doesn't capture contentType on stored blobs (only
// size/sha256), so this can't be exercised through the mock storage layer
// alone. The real Convex backend does capture it from the upload's
// Content-Type header.
export const ALLOWED_PROOF_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateProofUpload(meta: { contentType?: string; size: number }): void {
  if (!meta.contentType || !ALLOWED_PROOF_CONTENT_TYPES.has(meta.contentType)) {
    throw new Error("Proof must be a PNG, JPEG, or WebP image");
  }
  if (meta.size > MAX_PROOF_FILE_BYTES) {
    throw new Error("Proof file is too large (max 10MB)");
  }
}
