import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    // ogc-client parses multi-MB capabilities fixtures; the default 5s is too
    // tight when the whole monorepo suite runs in parallel.
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/ogc"),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
    },
  },
});
