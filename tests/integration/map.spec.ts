import type { Page, Route } from "@playwright/test";
import type BaseLayer from "ol/layer/Base";

import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

import ChSwisstopoPixelkarteFarbeDataset from "../fixtures/item-dataset-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChSwisstopoPixelkarteFarbeDistribution from "../fixtures/item-distribution-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChWmtsGeoadmin from "../fixtures/wmts-geoadminch.json" with { type: "json" };
import { waitForZoom } from "./utils";
const WMTSCapabilities = readFileSync(
  new URL("../fixtures/WMTSCapabilities.xml", import.meta.url),
  "utf-8",
);

const tileFixture = readFileSync(
  new URL("../fixtures/tile.jpeg", import.meta.url),
);

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

test.describe("map page", () => {
  const getZoom = async (page: Page) => {
    const mapRef = await page.evaluateHandle(() => window.swissgeoOlMap);
    const zoom = await page.evaluate((map) => map.getView().getZoom(), mapRef);
    return zoom;
  };

  const mockBackgroundRoutes = async (page: Page) => {
    const mockBackgroundResponse = (route: Route) =>
      route.fulfill({ status: 200, json: ChSwisstopoPixelkarteFarbeDataset });

    const mockWmtsResponse = (route: Route) =>
      route.fulfill({ status: 200, json: ChWmtsGeoadmin });

    // The actual mocks
    await page.route(
      "http://mock-oar.org/api/oar/collections/geoadmin.services/items/wmts-geoadminch",
      mockWmtsResponse,
    );

    await page.route(
      "http://mock-oar.org/api/oar/collections/ch.swisstopo.pixelkarte-farbe.distributions/items",
      (route) => {
        return route.fulfill({
          status: 200,
          json: ChSwisstopoPixelkarteFarbeDistribution,
        });
      },
    );

    // we let all the backgrounds to return the data for pixelkarte-farbe
    await page.route(
      "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/ch.swisstopo.*",
      mockBackgroundResponse,
    );

    await page.route(
      "https://wmts.geo.admin.ch/**/WMTSCapabilities.xml",
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/xml",
          body: WMTSCapabilities,
        }),
    );

    // mock the tiles
    await page.route("https://wmts.geo.admin.ch/1.0.0/**.jpeg", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        body: tileFixture,
      }),
    );
  };

  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    // override the OAR routes
    await mockBackgroundRoutes(page);

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
    await expect(page.getByTestId("fullscreen-toggle")).toBeVisible();
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
  });

  test("zoom buttons work", async ({ page }) => {
    await page.evaluateHandle(() => window.swissgeoOlMap);

    await test.step("Check simple zooming", async () => {
      await page.getByTestId("zoom-out").click();
      await waitForZoom(page);

      expect(await getZoom(page)).toEqual(0);

      await page.getByTestId("zoom-out").click();

      // second zoom-out click doesn't change the state
      // also not waiting here
      expect(await getZoom(page)).toEqual(0);
    });

    await test.step("Zoom all the way in", async () => {
      // now let's zoom all the way in
      for (let zoom = 1; zoom <= 13; zoom++) {
        await page.getByTestId("zoom-in").click();
        await waitForZoom(page);
        expect(await getZoom(page)).toEqual(zoom);
      }
    });
  });
});
