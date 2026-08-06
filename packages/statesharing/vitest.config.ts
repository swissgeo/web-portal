import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath, URL } from "url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reportsDirectory: path.resolve(
        __dirname,
        "../../coverage/unit/statesharing",
      ),
      reporter: ["lcov", "cobertura"],
      include: ["src/**/*.ts", "src/**/*.vue"],
      exclude: [...(configDefaults.coverage.exclude ?? []), "src/hey-api/**"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [vue()],
});
