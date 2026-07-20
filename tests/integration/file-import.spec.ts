import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { fileURLToPath } from "url";

import {
  cleanupExternalRequestMocks,
  HYDRATION_TIMEOUT,
  mockExternalRequests,
} from "./setup";

const fixturePath = (filename: string) =>
  fileURLToPath(new URL(`../fixtures/${filename}`, import.meta.url));

const getLayerCount = (page: Page) =>
  page.evaluate(
    () => window.swissgeoOlMap?.getLayers().getArray().length ?? 0,
  );

const getVectorFeatureCounts = (page: Page) =>
  page.evaluate(() =>
    window.swissgeoOlMap
      ?.getLayers()
      .getArray()
      .map((layer) => {
        const source = (
          layer as unknown as {
            getSource?: () => { getFeatures?: () => unknown[] } | undefined;
          }
        ).getSource?.();
        return source?.getFeatures ? source.getFeatures().length : null;
      }),
  );

test.describe("file import", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.waitForFunction(() => window.swissgeoOlMap !== undefined, null, {
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  const importFixture = async (page: Page, filename: string) => {
    await page.getByTestId("debug-open-import-local-panel").click();
    await page.getByTestId("file-input").setInputFiles(fixturePath(filename));
    await page.getByTestId("file-import-button").click();
    await expect(page.getByText(`Successfully imported ${filename}`)).toBeVisible();
  };

  // Both fixtures hold a Point and a LineString.
  const EXPECTED_FEATURES = 2;

  for (const filename of ["test-drawing.kml", "test-drawing.geojson"]) {
    test(`imports ${filename} and adds it as a layer on the map`, async ({
      page,
    }) => {
      const before = await getLayerCount(page);

      await importFixture(page, filename);

      await page.waitForFunction(
        (count) =>
          (window.swissgeoOlMap?.getLayers().getArray().length ?? 0) > count,
        before,
        { timeout: 20_000 },
      );

      expect(await getLayerCount(page)).toBe(before + 1);

      const featureCounts = await getVectorFeatureCounts(page);
      expect(featureCounts).toContain(EXPECTED_FEATURES);
    });
  }

  test("rejects an unsupported file type", async ({ page }) => {
    const before = await getLayerCount(page);

    await page.getByTestId("debug-open-import-local-panel").click();
    await page.getByTestId("file-input").setInputFiles({
      name: "unsupported.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a spatial file"),
    });
    await page.getByTestId("file-import-button").click();

    await expect(
      page.getByText("Unsupported file type: unsupported.txt"),
    ).toBeVisible();
    expect(await getLayerCount(page)).toBe(before);
  });
});
