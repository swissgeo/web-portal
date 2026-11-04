import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/numbers"),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
    },
    environment: "node",
  },
});
