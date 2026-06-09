import { defineConfig } from "@hey-api/openapi-ts";

import { APP_STATE_SERVICE_BASE_URL } from "./src/constants";

export default defineConfig({
  input: `${APP_STATE_SERVICE_BASE_URL}/openapi.json`,
  output: {
    path: "src/hey-api",
    postProcess: ["prettier"],
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      baseUrl: `${APP_STATE_SERVICE_BASE_URL}/`,
    },
    "zod",
    {
      name: "@hey-api/sdk",
      validator: "zod",
    },
  ],
});
