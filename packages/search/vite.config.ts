import { resolve } from "path";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

import { getBaseBuildConfig } from "../../base.vite.config";

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
        external: ["@swissgeo/shared", "@swissgeo/log"],
      },
    },
    plugins: [
      dts({
        bundleTypes: true,
      }),
    ],
  };
});
