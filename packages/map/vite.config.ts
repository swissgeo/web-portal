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
        name: "@swissgeo/map",
        formats: ["es"],
      },
      rollupOptions: {
        external: ["vue", "pinia", "@swissgeo/log", "vue-i18n", "@vueuse/core"],
      },
    },
    plugins: [
      vue(),
      dts({
        aliases: [subpathImportsDtsAlias(resolve(__dirname, "src"))],
        processor: "vue",
      }),
    ],
  };
});
