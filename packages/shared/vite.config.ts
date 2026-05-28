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
        formats: ["es"],
        name: "@swissgeo/shared",
      },
      rollupOptions: {
        external: ["nuxt"],
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      dts({
        beforeWriteFile: (filePath, content) => {
          const normalizedPath = filePath.replace(/\\/g, "/");
          const rewrittenPath = normalizedPath
            .replace("/dist/src/", "/dist/")
            .replace("/dist/types/", "/dist/");

          return {
            filePath: rewrittenPath,
            content,
          };
        },
        copyDtsFiles: true,
        include: [
          fileURLToPath(new URL("./src", import.meta.url)),
          fileURLToPath(new URL("./types", import.meta.url)),
        ],
      }),
    ],
  };
});
