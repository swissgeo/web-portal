import { defineConfig } from "@hey-api/openapi-ts";

import { APP_DRAW_SERVICE_BASE_URL } from "./src/constants";

export default defineConfig({
  input: `${APP_DRAW_SERVICE_BASE_URL}/openapi.json`,
  output: {
    path: "src/hey-api",
    postProcess: ["prettier"],
  },
  plugins: ["@hey-api/typescript", "zod"],
});
