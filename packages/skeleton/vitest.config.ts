import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["src/__tests__/config/components-stubs.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: resolve(__dirname, "../../coverage/unit/skeleton"),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
    },
  },
  plugins: [vue()],
});
