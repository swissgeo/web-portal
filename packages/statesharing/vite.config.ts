import vue from "@vitejs/plugin-vue";
import dts from "unplugin-dts/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

import { getBaseBuildConfig } from "../../base.vite.config";
export default defineConfig(({ mode }) => {
  return {
    build: {
      ...getBaseBuildConfig(mode),
      lib: {
        entry: [fileURLToPath(new URL("./src/index.ts", import.meta.url))],
        fileName: (format) => `index.${format}.js`,
        formats: ["es"],
        name: "@swissgeo/statesharing",
      },
      rollupOptions: {
        external: ["vue", "ol", "@swissgeo/shared"],
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
