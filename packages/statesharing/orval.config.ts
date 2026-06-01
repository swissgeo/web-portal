import fs from "fs";
import { defineConfig } from "orval";
import path from "path";

const shareServiceUrl =
  process.env.NUXT_SHARE_SERVICE_URL ??
  "https://www.dev.sgdi.tech/api/wps/v1/state";

export default defineConfig({
  stateshare: {
    input: {
      target: `${shareServiceUrl}/openapi.json`,
    },
    output: {
      target: "src/client",
      formatter: "prettier",
      client: "fetch",
      baseUrl: `${shareServiceUrl}/`,
      schemas: {
        path: "./src/client/schemas",
        type: "zod", // generates .zod.ts files alongside your TypeScript types
      },
      override: {
        fetch: {
          runtimeValidation: true, // validates responses automatically via the generated Zod schemas
        },
      },
    },
    hooks: {
      afterAllFilesWrite: [
        // Hook 1: Wipe out all ungenerated ExclusiveMin/Max dynamic variable errors globally
        () => {
          const targetDir = path.resolve("./src/client/schemas");

          if (fs.existsSync(targetDir)) {
            const files = fs
              .readdirSync(targetDir)
              .filter((file) => file.endsWith(".zod.ts"));

            files.forEach((file) => {
              const filePath = path.join(targetDir, file);
              let content = fs.readFileSync(filePath, "utf8");

              // Matches ".gt(anyVariableNameExclusiveMin)" and ".lt(anyVariableNameExclusiveMax)"
              // This targets alpha-numeric variable names that end with 'ExclusiveMin' or 'ExclusiveMax'
              const brokenGtRegex = /\.gt\([a-zA-Z0-9]+ExclusiveMin\)/g;
              const brokenLtRegex = /\.lt\([a-zA-Z0-9]+ExclusiveMax\)/g;

              let modified = false;

              if (brokenGtRegex.test(content)) {
                content = content.replace(brokenGtRegex, "");
                modified = true;
              }

              if (brokenLtRegex.test(content)) {
                content = content.replace(brokenLtRegex, "");
                modified = true;
              }

              // Write file changes back to disk if a match was cleaned up
              if (modified) {
                fs.writeFileSync(filePath, content, "utf8");
              }
            });
          }
        },
        // Hook 2: Run prettier over the modified files
        "prettier --write ./src/client",
      ],
    },
  },
});
