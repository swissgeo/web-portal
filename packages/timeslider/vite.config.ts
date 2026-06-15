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
        name: "@swissgeo/timeslider",
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          "vue",
          "lucide-vue-next",
          "@swissgeo/log",
          "@swissgeo/layers",
          "@swissgeo/numbers",
          "@swissgeo/skeleton",
          "@swissgeo/shared",
          "@vueuse/core",
          "vue-i18n",
          "@lucide/vue",
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
