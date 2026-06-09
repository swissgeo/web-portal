import { resolve } from "path";
import { dts } from "rolldown-plugin-dts";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

import { getBaseBuildConfig } from "../../base.vite.config";

export default defineConfig(({ mode }) => {
  return {
    build: {
      ...getBaseBuildConfig(mode),
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "@swissgeo/ogc",
      },
      rolldownOptions: {
        external: ["vue", "pinia", "@swissgeo/log"],
        output: [{ dir: "dist", format: "es" }],
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      dts({
        oxc: true,
      }),
    ],
    oxc: {
      exclude: [/\.js$/, /\.d\.[cm]?ts$/],
    },
  };
});
