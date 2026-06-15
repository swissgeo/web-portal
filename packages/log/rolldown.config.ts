import { dts } from "rolldown-plugin-dts";
const isDev = process.env.NODE_ENV === "development";

export default {
  input: {
    index: "src/index.ts",
    Message: "src/Message.ts",
  },
  plugins: [dts()],
  output: [
    {
      dir: "dist",
      format: "es",
      minify: !isDev,
      sourcemap: isDev,
    },
  ],
};
