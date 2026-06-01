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
      minify: false,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        formats: ["es"],
      },
      rollupOptions: {
        external: [],
        output: {
          exports: "named",
          globals: {},
        },
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
