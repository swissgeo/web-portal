import { defineConfig } from "@hey-api/openapi-ts";

const shareServiceUrl =
  process.env.NUXT_SHARE_SERVICE_URL ??
  "https://www.dev.sgdi.tech/api/wps/v1/state";

export default defineConfig({
  input: `${shareServiceUrl}/openapi.json`,
  output: {
    path: "src/hey-api",
    postProcess: ["prettier"],
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      baseUrl: `${shareServiceUrl}/`,
    },
    "zod",
    {
      name: "@hey-api/sdk",
      validator: "zod",
    },
  ],
});
