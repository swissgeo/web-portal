import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

import {
  getBaseBuildConfig,
  subpathImportsDtsAlias,
} from "../../base.vite.config";

export default defineConfig(({ mode }) => {
  return {
    build: {
      ...getBaseBuildConfig(mode),
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "@swissgeo/content",
        formats: ["es"],
      },
      rollupOptions: {
        external: ["vue", "pinia", "nuxt"],
        output: {
          exports: "named",
          globals: {
            vue: "Vue",
          },
        },
      },
    },
    plugins: [
      vue(),
      dts({
        aliases: [subpathImportsDtsAlias(resolve(__dirname, "src"))],
        bundleTypes: true,
        processor: "vue",
      }),
    ],
  };
});
