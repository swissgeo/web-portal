import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

import { getBaseBuildConfig } from "../../base.vite.config";

export default defineConfig(({ mode }) => {
  return {
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["src/__tests__/config/components-stubs.ts"],
      coverage: {
        provider: "v8",
        reportsDirectory: resolve(__dirname, "../../coverage/unit/skeleton"),
        reporter: ["lcov", "cobertura"],
      },
    },
    build: {
      ...getBaseBuildConfig(mode),
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "@swissgeo/skeleton",
        formats: ["es"],
      },
      rollupOptions: {
        external: ["vue", "pinia", "@nuxt/ui", /#components/, "vue-i18n"],
        output: {
          exports: "named",
          globals: {
            vue: "Vue",
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      vue(),
      dts({
        bundleTypes: true,
        processor: "vue",
      }),
    ],
  };
});
