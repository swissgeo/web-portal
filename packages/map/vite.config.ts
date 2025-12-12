import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import dts from "unplugin-dts/vite";
import AutoImportComponents from "unplugin-vue-components/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }): UserConfig => {
  return {
    build: {
      // don't minify in dev build. This helps with debugging
      // maybe this could be solved in a better way with sourcemap?
      minify: mode === "development" ? false : true,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        fileName: (format) => `index.${format}.js`,
        //     index: resolve(__dirname, 'src/index.ts'),
        //     // api: resolve(__dirname, 'src/api/index.ts'),
        //     // parsers: resolve(__dirname, 'src/parsers/index.ts'),
        //     // utils: resolve(__dirname, 'src/utils/index.ts'),
        //     // validation: resolve(__dirname, 'src/validation/index.ts'),
        //     // vue: resolve(__dirname, 'src/vue/index.ts'),
        // },
        name: "@swissgeo/map",
      },
      rollupOptions: {
        external: ["vue"],
        output: {
          exports: "named",
          globals: {
            vue: "Vue",
          },
        },
      },
      sourcemap: true,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      AutoImport({
        dirs: ["./src/**"],
        imports: [
          // Presets
          "vue",
          "vue-router",
          "vue-i18n",
          "@vueuse/core",
          "vee-validate",
        ],
        eslintrc: {
            enabled: true,
            filepath: '.output/eslintrc-auto-import.json'
        },
        // Automatically generate types
        dts: "./.nuxt/auto-imports.d.ts",
        // Auto import inside Vue template
        vueTemplate: true,
      }),
      AutoImportComponents({
        dts: "./.nuxt/auto-components.d.ts",
        dirs: ["./src/**"],
      }),
      dts({
        bundleTypes: true,
        processor: "vue",
      }),
      tsconfigPaths(),
      vue(),
    ],
  };
});
