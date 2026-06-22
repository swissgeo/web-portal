import path from "path";
import { mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, {
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/numbers"),
      reporter: ["lcov", "cobertura"],
    },
    environment: "node",
  },
});
