import type { Page } from "@playwright/test";
import type { Map as OlMapType } from "ol";

import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    swissgeoOlMap?: OlMapType;
  }
}

const HYDRATION_TIMEOUT = 60_000;

/**
 * Tier-3 visual-regression check (GPS-732). Loads the MapLibre GeoJSON demo layer
 * (debug panel → "Add MapLibre GeoJSON demo") and snapshots the map so future
 * converter/renderer changes that alter the rendered styling are caught as pixel
 * diffs.
 *
 * Gated behind RUN_VISUAL_TESTS because it needs a committed screenshot baseline.
 * Generate the baseline once in a real browser:
 *   RUN_VISUAL_TESTS=1 pnpm test:integration \
 *     tests/integration/maplibre-geojson-visual.spec.ts --update-snapshots
 * then commit the generated *-snapshots/ folder.
 */
async function mockExternalRequests(page: Page) {
  await page.route("**/api/oar/**", (route) =>
    route.fulfill({ status: 200, json: { collections: [], links: [] } }),
  );
}

test.describe("MapLibre GeoJSON demo — visual", () => {
  test.skip(
    !process.env.RUN_VISUAL_TESTS,
    "visual regression; set RUN_VISUAL_TESTS=1 and generate a baseline first",
  );

  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page);
    await page.goto("/en/map");
    await expect(page.locator('[data-testid="ol-map"]')).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test("renders the converted geoadmin style (circle/triangle/diamond)", async ({
    page,
  }) => {
    // Headless map boot + the reactive layer-add chain can exceed Playwright's
    // default 30s test budget, so give the whole test room (must exceed the
    // waitForFunction timeout below).
    test.setTimeout(120_000);

    // The button is a Nuxt UI UButton whose data-testid does not reach the DOM
    // (ULink inheritAttrs: false), so locate it by its accessible name.
    await page
      .getByRole("button", { name: "Add MapLibre GeoJSON demo" })
      .click();

    // Wait until the demo layer's features exist in the OpenLayers map.
    await page.waitForFunction(
      () => {
        const map = window.swissgeoOlMap;
        if (!map) {
          return false;
        }
        return map
          .getAllLayers()
          .some((layer) => layer.get("id") === "poc-maplibre-grundwasser");
      },
      { timeout: HYDRATION_TIMEOUT },
    );
    // Let the vector layer finish rendering before snapshotting.
    await page.waitForTimeout(1000);

    await expect(page.getByTestId("ol-map")).toHaveScreenshot(
      "maplibre-geojson-demo.png",
      { maxDiffPixelRatio: 0.02 },
    );
  });
});
