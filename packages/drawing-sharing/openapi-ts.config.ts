import { defineConfig } from "@hey-api/openapi-ts";

const drawingServiceEndpoint =
  process.env.NUXT_PUBLIC_DRAWING_SERVICE_ENDPOINT ??
  "https://www.dev.sgdi.tech/api/wps/v1/drawings";

export default defineConfig({
  input: `${drawingServiceEndpoint}/openapi.json`,
  output: {
    path: "src/hey-api",
    postProcess: ["prettier"],
  },
  plugins: ["@hey-api/typescript", "zod"],
});
