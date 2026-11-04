import { resolve } from "path";
import dts from "unplugin-dts/vite";
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
        name: "@swissgeo/search",
      },
      rollupOptions: {
        external: [
          "@swissgeo/shared",
          "@swissgeo/log",
          "@swissgeo/ogc",
          "@swissgeo/coordinates",
        ],
      },
    },
    plugins: [
      dts({
        aliases: [subpathImportsDtsAlias(resolve(__dirname, "src"))],
        bundleTypes: true,
      }),
    ],
  };
});
