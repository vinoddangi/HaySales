/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  test: {
    environment: "happy-dom",
    exclude: ["**/node_modules/**", "**/.vscode/**"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
