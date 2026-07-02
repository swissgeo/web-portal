import path from "path";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(__dirname, "../../coverage/unit/layers"),
      reporter: ["lcov", "cobertura"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
