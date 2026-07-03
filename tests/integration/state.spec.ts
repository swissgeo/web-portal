import type BaseLayer from "ol/layer/Base";

import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

test.describe("state loading", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("loads no background if the state demands it", async ({ page }) => {
    const stateStr = btoa(
      JSON.stringify({
        version: "1.0",
        state: {
          layers: [],
        },
      }),
    );
    await page.goto(`/de/map?statestr=${stateStr}`);

    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });

    const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap);
    const layers = await page.evaluate((map) => {
      const arr = map.getLayers().getArray();
      return arr.map((layer: BaseLayer) => ({
        name: layer.get("id"),
        opacity: layer.getOpacity(),
        visible: layer.getVisible(),
      }));
    }, mapRef);

    expect(layers).toHaveLength(0);
    const backgroundSelector = page.getByTestId("background-selector-void");
    await expect(backgroundSelector).toBeVisible();
  });
});
