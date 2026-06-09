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
        name: "@swissgeo/map",
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          "vue",
          "pinia",
          "@lucide/vue",
          "@swissgeo/log",
          "vue-i18n",
          "@vueuse/core",
        ],
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@stores": fileURLToPath(new URL("./src/stores", import.meta.url)),
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
