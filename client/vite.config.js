import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Requests beginning with /api are forwarded to the live Render backend
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "https://nivora-care-hospital.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    include: ["src/**/*.test.{js,jsx}"],
    pool: "forks",
    fileParallelism: false,
    isolate: false,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-dom") ||
              id.includes("react-router") ||
              id.includes("/react/") ||
              id.includes("\\react\\") ||
              id.includes("scheduler")
            ) {
              return "vendor-react";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("html5-qrcode")) {
              return "vendor-qr";
            }
            if (id.includes("axios") || id.includes("qrcode")) {
              return "vendor-utils";
            }
          }
        },
      },
    },
  },
});
