import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment for plain TS unit tests (lib/*). Convex function
    // tests (convex/*.test.ts) opt into `edge-runtime` per-file via a
    // `// @vitest-environment edge-runtime` comment, since that's what
    // convex-test requires to emulate Convex's runtime. Component tests opt
    // into `jsdom` the same way.
    environment: "node",
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
