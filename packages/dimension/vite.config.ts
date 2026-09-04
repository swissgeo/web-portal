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
        name: "@swissgeo/dimension",
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          "vue",
          "lucide-vue-next",
          "@nuxt/ui",
          "@swissgeo/log",
          "@swissgeo/numbers",
          "@swissgeo/shared",
          "@vueuse/core",
          "pinia",
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
