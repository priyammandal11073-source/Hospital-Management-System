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
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-utils": ["axios", "qrcode"],
        },
      },
    },
  },
});
