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
  page.evaluate(() => window.swissgeoOlMap?.getLayers().getArray().length ?? 0);

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

// Keyed by the layer id, which useOlJSONLayer sets to the filename, so
// the lookup doesn't depend on where OpenLayers ordered the layer.
const getVectorExtentById = (page: Page, layerId: string) =>
  page.evaluate((id) => {
    const layer = window.swissgeoOlMap
      ?.getLayers()
      .getArray()
      .find((candidate) => candidate.get("id") === id);
    const source = (
      layer as unknown as {
        getSource?: () => { getExtent?: () => number[] } | undefined;
      }
    )?.getSource?.();
    return source?.getExtent ? source.getExtent() : null;
  }, layerId);

test.describe("file import", () => {
  test.beforeEach(async ({ page }) => {
    // Cold-boot compile of /de/map plus first map paint can exceed the 30s
    // default; give the hydration waits room so they don't rely on a retry.
    test.setTimeout(HYDRATION_TIMEOUT + 30_000);
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

  // The panel toggle sits behind the open panel, so it can only be clicked
  // while the panel is closed. Tests importing twice open it once and then
  // call importSelected repeatedly.
  const openImportPanel = (page: Page) =>
    page.getByTestId("debug-open-import-local-panel").click();

  const importSelected = async (page: Page, filename: string) => {
    await page.getByTestId("file-input").setInputFiles(fixturePath(filename));
    await page.getByTestId("file-import-button").click();
    await expect(
      page.getByText(`Successfully imported ${filename}`),
    ).toBeVisible();
  };

  // Both fixtures hold a Point and a LineString.
  const EXPECTED_FEATURES = 2;

  for (const filename of [
    "test-drawing.kml",
    "test-drawing.geojson",
    "test-drawing-lv95.geojson",
  ]) {
    test(`imports ${filename} and adds it as a layer on the map`, async ({
      page,
    }) => {
      const before = await getLayerCount(page);

      await openImportPanel(page);
      await importSelected(page, filename);

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

  // The `crs` property is obsolete per RFC 7946, but a lot of our internal
  // GeoJSON still carries it, so both fixtures must land on the same spot.
  test("honours the crs property of a GeoJSON file", async ({ page }) => {
    const extentOf = async (filename: string) => {
      await importSelected(page, filename);
      await page.waitForFunction(
        (id) =>
          window.swissgeoOlMap
            ?.getLayers()
            .getArray()
            .some((layer) => layer.get("id") === id) ?? false,
        filename,
        { timeout: 20_000 },
      );
      return (await getVectorExtentById(page, filename))!;
    };

    await openImportPanel(page);
    const wgs84Extent = await extentOf("test-drawing.geojson");
    const lv95Extent = await extentOf("test-drawing-lv95.geojson");

    // The LV95 fixture holds the same points rounded to metres, hence the
    // few-metres tolerance.
    lv95Extent.forEach((value, index) => {
      expect(value).toBeCloseTo(wgs84Extent[index]!, -1);
    });
  });

  test("rejects a JSON file that is not GeoJSON", async ({ page }) => {
    const before = await getLayerCount(page);

    await page.getByTestId("debug-open-import-local-panel").click();
    await page.getByTestId("file-input").setInputFiles({
      name: "plain.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"title": "un JSON standard"}'),
    });
    await page.getByTestId("file-import-button").click();

    await expect(
      page.getByText("Invalid GeoJSON file: plain.json"),
    ).toBeVisible();
    expect(await getLayerCount(page)).toBe(before);
  });

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
