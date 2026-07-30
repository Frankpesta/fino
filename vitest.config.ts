import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// convex-test runs Convex functions in-process rather than against the real
// deployment, so it needs JWT_PRIVATE_KEY/JWKS/SITE_URL in process.env
// directly -- they normally only live in the deployment's own env store
// (set via `npx @convex-dev/auth`). .env.test.local holds a copy of those
// same dev-deployment values for local test runs; it's gitignored (`.env*`)
// since it's still a private key, just a low-stakes dev one.
const testEnvPath = path.resolve(__dirname, ".env.test.local");
if (fs.existsSync(testEnvPath)) {
  process.loadEnvFile(testEnvPath);
}

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment for plain TS unit tests (lib/*). Convex function
    // tests (convex/*.test.ts) opt into `edge-runtime` per-file via a
    // `// @vitest-environment edge-runtime` comment, since that's what
    // convex-test requires to emulate Convex's runtime. Component tests opt
    // into `jsdom` the same way.
    environment: "node",
    testTimeout: 15_000,
    server: {
      deps: { inline: ["convex-test"] },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
