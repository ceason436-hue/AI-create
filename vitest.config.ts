import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/.next/**", "**/.next-temporary/**", "**/.next-temporary-*/**", "**/coverage/**", "**/e2e/**"],
  },
});
