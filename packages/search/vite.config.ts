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
        formats: ["es"],
        fileName: (format) => `index.${format}.js`,
        name: "@swissgeo/search",
      },
      rollupOptions: {
        external: ["vue", "@swissgeo/shared", "@swissgeo/log"],
        output: {
          exports: "named",
          globals: {
            vue: "Vue",
          },
        },
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
        cleanVueFileName: true,
        include: [
          fileURLToPath(new URL("./src", import.meta.url)),
          fileURLToPath(new URL("./types", import.meta.url)),
        ],
        insertTypesEntry: true,
        outDirs: [fileURLToPath(new URL("./dist", import.meta.url))],
        tsconfigPath: fileURLToPath(
          new URL("./tsconfig.json", import.meta.url),
        ),
      }),
    ],
  };
});
