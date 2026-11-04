import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { fileURLToPath, URL } from "url";
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
        formats: ["es"],
        name: "@swissgeo/shared",
      },
      rollupOptions: {
        external: ["nuxt", "@swissgeo/numbers", "vue"],
      },
    },
    plugins: [
      dts({
        aliases: [subpathImportsDtsAlias(resolve(__dirname, "src"))],
        beforeWriteFile: (filePath, content) => {
          const normalizedPath = filePath.replace(/\\/g, "/");
          const rewrittenPath = normalizedPath
            .replace("/dist/packages/shared/src/", "/dist/")
            .replace("/dist/packages/shared/types/", "/dist/");

          return {
            filePath: rewrittenPath,
            content,
          };
        },
        copyDtsFiles: true,
        include: [fileURLToPath(new URL("./src", import.meta.url))],
      }),
    ],
  };
});
