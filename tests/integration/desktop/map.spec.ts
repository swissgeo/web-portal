import type { Page } from "@playwright/test";
import type BaseLayer from "ol/layer/Base";

import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  mockMapBackground,
  cleanupExternalRequestMocks,
} from "../setup";
import { waitForZoom } from "../utils";

test.describe("map page", () => {
  const getZoom = async (page: Page) => {
    const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap);
    const zoom = await page.evaluate((map) => map.getView().getZoom(), mapRef);
    return zoom;
  };

  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    // override the OAR routes
    await mockMapBackground(page);

    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("renders the OpenLayers map canvas", async ({ page }) => {
    await expect(page.getByTestId("ol-map")).toBeVisible();
  });

  test("displays the toolbox with zoom controls", async ({ page }) => {
    await expect(page.getByTestId("toolbox-right")).toBeVisible();
    await expect(page.getByTestId("zoom-in")).toBeVisible();
    await expect(page.getByTestId("zoom-out")).toBeVisible();
  });

  test("displays the fullscreen button", async ({ page }) => {
    await expect(page.getByTestId("toolbox-fullscreen-button")).toBeVisible();
  });

  test("toggles the real browser fullscreen", async ({ page }) => {
    const button = page.getByTestId("toolbox-fullscreen-button");
    const isFullscreen = () =>
      page.evaluate(() => !!document.fullscreenElement);

    await button.click();
    await expect.poll(isFullscreen).toBe(true);

    await button.click();
    await expect.poll(isFullscreen).toBe(false);
  });

  test("leaves the fullscreen mode when the browser exits fullscreen", async ({
    page,
  }) => {
    const topbar = page.getByTestId("topbar-logo-link");
    await page.getByTestId("toolbox-fullscreen-button").click();
    await expect(topbar).toBeHidden();
    await page.waitForFunction(() => !!document.fullscreenElement);

    // what pressing Escape does in real fullscreen
    await page.evaluate(() => document.exitFullscreen());
    await expect(topbar).toBeVisible();
  });

  test("displays the map with the defaults", async ({ page }) => {
    await page.waitForFunction(() => window.swissgeoOlMap !== undefined, null, {
      timeout: 20000,
    });
    const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap);
    const zoom = await page.evaluate((map) => map.getView().getZoom(), mapRef);
    const center = await page.evaluate(
      (map) => map.getView().getCenter(),
      mapRef,
    );
    expect(zoom).toEqual(1);
    expect(center).toEqual([2660000, 1190000]);
  });

  test("Loads the pixelkarte-farbe as default background", async ({ page }) => {
    await page.waitForFunction(() => window.swissgeoOlMap !== undefined, null, {
      timeout: 20000,
    });
    const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap);
    // The WMTS background source is built asynchronously (ogc-client parses the
    // capabilities, then the OL tile grid is created), so wait for the layer to
    // be added before sampling.
    await page.waitForFunction(
      (map) => map.getLayers().getArray().length >= 1,
      mapRef,
      { timeout: 20000 },
    );
    const layers = await page.evaluate((map) => {
      const arr = map.getLayers().getArray();
      return arr.map((layer: BaseLayer) => ({
        name: layer.get("id"),
        opacity: layer.getOpacity(),
        visible: layer.getVisible(),
      }));
    }, mapRef);

    expect(layers).toHaveLength(1);
    expect(layers[0].name).toEqual("ch.swisstopo.pixelkarte-farbe");
    expect(layers[0].opacity).toBe(1);
    expect(layers[0].visible).toBe(true);

    await page.getByTestId("background-selector-toggle").click();
    const backgroundSelector = page
      .getByTestId("background-selector-dat_pixelkarte-farbe")
      .first();
    await expect(backgroundSelector).toBeVisible();
  });

  test("zoom buttons work", async ({ page }) => {
    await page.evaluateHandle(() => window.swissgeoOlMap);

    await test.step("Check simple zooming", async () => {
      await page.getByTestId("zoom-in").click();
      await waitForZoom(page);

      expect(await getZoom(page)).toEqual(2);

      await page.getByTestId("zoom-out").click();
      await waitForZoom(page);

      expect(await getZoom(page)).toEqual(1);
    });

    await test.step("Zoom all the way in", async () => {
      // now let's zoom all the way in
      while ((await getZoom(page)) !== 0) {
        await page.getByTestId("zoom-out").click();
        await waitForZoom(page);
      }

      for (let zoom = 1; zoom <= 13; zoom++) {
        await page.getByTestId("zoom-in").click();
        await waitForZoom(page);
        expect(await getZoom(page)).toEqual(zoom);
      }
      await expect(page.getByTestId("zoom-in")).toBeDisabled();
    });
  });
});
