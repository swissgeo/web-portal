import vue from "@vitejs/plugin-vue";
import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/map"),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
      exclude: [
        ...configDefaults.coverage.exclude,
        "*/__tests__/__mocks__/**/*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [vue()],
});
