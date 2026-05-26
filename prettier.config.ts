import defineConfig from "@swissgeo/config-prettier";

const config = defineConfig(
  "@prettier/plugin-xml",
  // not using this as this goes into an infinite recursion
  // "prettier-plugin-jsdoc",
  "prettier-plugin-packagejson",
  "prettier-plugin-tailwindcss",
);

// https://github.com/tailwindlabs/prettier-plugin-tailwindcss?tab=readme-ov-file#specifying-your-tailwind-stylesheet-path-tailwind-css-v4
config.tailwindStylesheet = "./packages/main/app/assets/css/main.css";

export default config;
