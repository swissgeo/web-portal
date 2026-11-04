import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/content"),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
    },
  },
  plugins: [vue()],
});
