import path from "path";
import { mergeConfig } from "vitest/config";

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
    },
    setupFiles: ["setup-vitest.ts"],
  },
});
