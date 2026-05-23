import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./app/lib"),
      "@/components": path.resolve(__dirname, "./app/components"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
