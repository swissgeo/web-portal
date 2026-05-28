import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { getBaseBuildConfig } from "../../base.vite.config";

export default defineConfig(({ mode }) => {
  return {
    build: {
      ...getBaseBuildConfig(mode),
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "@swissgeo/elevation-profile",
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          "vue",
          "chart.js",
          "vue-chartjs",
          "@swissgeo/log",
          "proj4",
          /^ol(\/|$)/,
        ],
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
      },
    },
    plugins: [
      tsconfigPaths(),
      vue(),
      dts({
        bundleTypes: true,
        processor: "vue",
      }),
    ],
  };
});
