import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/types/**", "src/index.ts", "**/*.d.ts"],
    },
    testTimeout: 10000,
    // Run tests sequentially to avoid port conflicts (each test imports the Express app on port 8484)
    fileParallelism: false,
  },
});
