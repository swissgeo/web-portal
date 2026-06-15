import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

import { getBaseBuildConfig } from "../../base.vite.config";

export default defineConfig(({ mode }) => {
  return {
    build: {
      ...getBaseBuildConfig(mode),
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "@swissgeo/drawing",
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          "vue",
          "vue-i18n",
          "pinia",
          "@swissgeo/layers",
          "@swissgeo/log",
          "@swissgeo/shared",
          /^ol(\/|$)/,
          "@lucide/vue",
          "proj4",
          "@vueuse/core",
        ],
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
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
