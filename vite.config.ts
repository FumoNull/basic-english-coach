/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? "/basic-english-coach/" : "/",
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  test: {
    environment: "node",
    globals: true,
  },
}));
