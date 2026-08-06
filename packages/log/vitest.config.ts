import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/log"),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts"],
    },
  },
});
