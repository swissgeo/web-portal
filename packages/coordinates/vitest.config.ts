import path from "path";
import { configDefaults, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, {
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(
        __dirname,
        "../../coverage/unit/coordinates",
      ),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
      exclude: [
        ...(configDefaults.coverage.exclude ?? []),
        "src/DevApp.vue",
        "src/dev.ts",
      ],
    },
    setupFiles: ["setup-vitest.ts"],
  },
});
