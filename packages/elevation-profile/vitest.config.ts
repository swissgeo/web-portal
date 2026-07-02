import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(
        __dirname,
        "../../coverage/unit/elevation-profile",
      ),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [vue()],
});
