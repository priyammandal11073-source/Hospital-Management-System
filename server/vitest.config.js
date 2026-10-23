import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    env: {
      NODE_ENV: "test",
      MONGO_URI: "mongodb://127.0.0.1:27017/hospital-test-db",
      JWT_SECRET: "test-jwt-secret-not-for-production",
    },
  },
});