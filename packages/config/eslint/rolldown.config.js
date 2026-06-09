const isDev = process.env.NODE_ENV === "development";

export default {
  input: "./index.ts",
  output: [
    {
      dir: "dist",
      format: "es",
      minify: !isDev,
      sourcemap: isDev,
    },
  ],
  external: [
    /^@eslint\/.*/,
    /^@typescript-eslint\/.*/,
    /^@vue\/.*/,
    /^eslint.*/,
    /^typescript-eslint/,
    "globals",
  ],
};
