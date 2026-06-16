import { expect, test as base } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const isCoverage = process.env.COVERAGE === "1";
const coverageDir = join(process.cwd(), "coverage/integration");

export const test = base.extend<{ collectCoverage: void }>({
  collectCoverage: [
    async ({ page }, use) => {
      if (isCoverage) {
        await page.coverage.startJSCoverage();
      }
      await use();
      if (!isCoverage) {
        return;
      }
      const coverage = await page.coverage.stopJSCoverage();
      if (!coverage.length) {
        return;
      }
      mkdirSync(coverageDir, { recursive: true });
      writeFileSync(
        join(coverageDir, `${randomUUID()}.json`),
        JSON.stringify(coverage),
      );
    },
    { auto: true },
  ],
});

export { expect };
