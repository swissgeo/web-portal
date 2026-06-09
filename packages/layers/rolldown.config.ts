import { dts } from "rolldown-plugin-dts";

const isDev = process.env.NODE_ENV === "development";

export default {
  input: "./src/index.ts",
  plugins: [dts()],
  output: [
    {
      dir: "dist",
      format: "es",
      minify: !isDev,
      sourcemap: isDev,
    },
  ],
  external: ["vue", "pinia", "@swissgeo/log"],
};
