import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "path";

export default defineNitroPlugin((nitro) => {
  (
    nitro.hooks as { hook: (name: string, cb: () => Promise<void>) => void }
  ).hook("nitro:build:public-assets", async () => {
    const modules = ["map", "ogc"];

    for (const module of modules) {
      const libDist = fileURLToPath(
        new URL(`../../../${module}/dist`, import.meta.url),
      );
      const outputPublicDir = (
        nitro as { options?: { output?: { publicDir?: string } } }
      ).options?.output?.publicDir;

      if (!outputPublicDir) {
        return;
      }

      const outDir = path.join(outputPublicDir, module);

      await cp(libDist, outDir, {
        recursive: true,
        filter: (sourcePath) => sourcePath.endsWith(".map"),
      });
    }
  });
});
