const isDev = process.env.NODE_ENV === "development";

export default {
  input: "src/index.ts",
  output: [
    {
      dir: "dist",
      format: "es",
      minify: !isDev,
      sourcemap: isDev,
    },
  ],
};
