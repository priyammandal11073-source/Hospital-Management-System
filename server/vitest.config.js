import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-not-for-production",
    },
  },
});