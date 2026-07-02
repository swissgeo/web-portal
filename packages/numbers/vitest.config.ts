import path from "path";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/numbers"),
      reporter: ["lcov", "cobertura"],
    },
    environment: "node",
  },
});
