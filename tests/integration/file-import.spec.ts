import type { Page, Route } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

import ChSwisstopoPixelkarteFarbeDataset from "../fixtures/item-dataset-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChSwisstopoPixelkarteFarbeDistribution from "../fixtures/item-distribution-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChWmtsGeoadmin from "../fixtures/wmts-geoadminch.json" with { type: "json" };
import {
  cleanupExternalRequestMocks,
  HYDRATION_TIMEOUT,
  mockExternalRequests,
} from "./setup";

const WMTSCapabilities = readFileSync(
  new URL("../fixtures/WMTSCapabilities.xml", import.meta.url),
  "utf-8",
);
const tileFixture = readFileSync(
  new URL("../fixtures/tile.jpeg", import.meta.url),
);

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

// A default background is required: the source-to-map conversion pipeline places
// overlay layers after the background (map slot 0), so the map must boot with one
// for imported files to render — mirrors map.spec.ts.
const mockBackgroundRoutes = async (page: Page) => {
  await page.route(
    "http://mock-oar.org/api/oar/collections/geoadmin.services/items/wmts-geoadminch",
    (route: Route) => route.fulfill({ status: 200, json: ChWmtsGeoadmin }),
  );
  await page.route(
    "http://mock-oar.org/api/oar/collections/ch.swisstopo.pixelkarte-farbe.distributions/items",
    (route: Route) =>
      route.fulfill({
        status: 200,
        json: ChSwisstopoPixelkarteFarbeDistribution,
      }),
  );
  await page.route(
    "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/ch.swisstopo.*",
    (route: Route) =>
      route.fulfill({ status: 200, json: ChSwisstopoPixelkarteFarbeDataset }),
  );
  await page.route(
    "https://wmts.geo.admin.ch/**/WMTSCapabilities.xml",
    (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "application/xml",
        body: WMTSCapabilities,
      }),
  );
  await page.route("https://wmts.geo.admin.ch/1.0.0/**.jpeg", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "image/jpeg",
      body: tileFixture,
    }),
  );
};

test.describe("file import", () => {
  test.beforeEach(async ({ page }) => {
    // Cold-boot compile of /de/map plus first map paint can exceed the 30s
    // default; give the hydration waits room so they don't rely on a retry.
    test.setTimeout(HYDRATION_TIMEOUT + 30_000);
    await mockExternalRequests(page).mockAll();
    await mockBackgroundRoutes(page);
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.waitForFunction(
      () => (window.swissgeoOlMap?.getLayers().getArray().length ?? 0) > 0,
      null,
      { timeout: HYDRATION_TIMEOUT },
    );
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  const importFixture = async (page: Page, filename: string) => {
    await page.getByTestId("debug-open-import-local-panel").click();
    await page.getByTestId("file-input").setInputFiles(fixturePath(filename));
    await page.getByTestId("file-import-button").click();
    await expect(
      page.getByText(`Successfully imported ${filename}`),
    ).toBeVisible();
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
