import defineConfig from "@swissgeo/config-prettier";

const config =  defineConfig(
  "@prettier/plugin-xml",
  // using an old version here because of this:
  // https://github.com/tailwindlabs/prettier-plugin-tailwindcss/issues/424
  // "prettier-plugin-jsdoc",
  "prettier-plugin-packagejson",
  "prettier-plugin-tailwindcss",
);


// https://github.com/tailwindlabs/prettier-plugin-tailwindcss?tab=readme-ov-file#specifying-your-tailwind-stylesheet-path-tailwind-css-v4
config.tailwindStylesheet = "./packages/main/app/assets/css/main.css"

export default config
