import type { Page } from "@playwright/test";
import type { Map as OlMapType } from "ol";

import { expect, test } from "@playwright/test";

import grundwasserData from "../../packages/main/app/assets/poc/hydroweb-grundwasser.data.json" with { type: "json" };
import grundwasserStyle from "../../packages/main/app/assets/poc/hydroweb-grundwasser.style.json" with { type: "json" };

declare global {
  interface Window {
    swissgeoOlMap?: OlMapType;
  }
}

const HYDRATION_TIMEOUT = 60_000;
const DEMO_LAYER = "ch.bafu.hydroweb-messstationen_grundwasser";

/**
 * Tier-3 visual-regression check (GPS-732). Opens the debug "Load geoadmin
 * GeoJSON…" picker, adds the grundwasser layer via the MapLibre path, and
 * snapshots the map so converter/renderer changes that alter the styling are
 * caught as pixel diffs. The POC proxy is mocked with committed fixtures so the
 * render is deterministic (no live network).
 *
 * Gated behind RUN_VISUAL_TESTS because it needs a committed screenshot baseline.
 * Generate the baseline once in a real browser:
 *   RUN_VISUAL_TESTS=1 pnpm test:integration \
 *     tests/integration/maplibre-geojson-visual.spec.ts --update-snapshots
 * then commit the generated *-snapshots/ folder.
 */
async function mockRequests(page: Page) {
  await page.route("**/api/oar/**", (route) =>
    route.fulfill({ status: 200, json: { collections: [], links: [] } }),
  );
  // The POC proxy (server/api/wpa/v1/poc/geojson) — return the fixtures so the
  // picker renders the same data every run.
  await page.route("**/api/wpa/v1/poc/geojson**", (route) => {
    const target = new URL(route.request().url()).searchParams.get("url") ?? "";
    const json = target.includes("vectorStyles")
      ? grundwasserStyle
      : grundwasserData;
    return route.fulfill({ status: 200, json });
  });
}

test.describe("MapLibre GeoJSON demo — visual", () => {
  test.skip(
    !process.env.RUN_VISUAL_TESTS,
    "visual regression; set RUN_VISUAL_TESTS=1 and generate a baseline first",
  );

  test.beforeEach(async ({ page }) => {
    await mockRequests(page);
    await page.goto("/en/map");
    await expect(page.locator('[data-testid="ol-map"]')).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test("renders the converted geoadmin style (circle/triangle/diamond)", async ({
    page,
  }) => {
    // Headless map boot + the reactive layer-add chain can exceed Playwright's
    // default 30s test budget, so give the whole test room.
    test.setTimeout(120_000);

    // Open the picker (UButton data-testid doesn't reach the DOM, so match name).
    await page.getByRole("button", { name: /Load geoadmin GeoJSON/ }).click();
    await page
      .getByTestId("debug-geojson-layer-select")
      .selectOption(DEMO_LAYER);
    await page.getByRole("button", { name: "Add (MapLibre)" }).click();

    // Wait until the layer's features exist in the OpenLayers map.
    await page.waitForFunction(
      (layerId) => {
        const map = window.swissgeoOlMap;
        if (!map) {
          return false;
        }
        return map.getAllLayers().some((layer) => layer.get("id") === layerId);
      },
      `${DEMO_LAYER}-maplibre`,
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
