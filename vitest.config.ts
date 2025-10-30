import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  css: {
    // Avoid loading project PostCSS config during unit tests
    postcss: { plugins: [] },
  },
})


