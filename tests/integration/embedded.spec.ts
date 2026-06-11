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

const basicMapStateFixture = JSON.stringify({
  version: "1.0",
  state: {
    map: { center: [2660000, 1190000], zoom: 1, rotation: 0 },
    layers: [],
    backgroundLayer: {
      layerUrl:
        "http://mock-oar.org/api/oar/items/ch.swisstopo.pixelkarte-farbe",
      type: "dataset",
      isVisible: true,
      opacity: 1,
    },
  },
});

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

test.describe("embedded map page", () => {
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
      "http://mock-oar.org/api/oar/v0/collections/geoadmin.services/items/wmts-geoadminch",
      mockWmtsResponse,
    );

    await page.route(
      "http://mock-oar.org/api/oar/v0/collections/ch.swisstopo.pixelkarte-farbe*",
      (route) =>
        route.fulfill({
          status: 200,
          json: ChSwisstopoPixelkarteFarbeDistribution,
        }),
    );

    // we let all the backgrounds to return the data for pixelkarte-farbe
    await page.route(
      "http://mock-oar.org/api/oar/items/ch.swisstopo.*",
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

    await page.goto("/en/embedded");
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

  test("does not displays the fullscreen button", async ({ page }) => {
    await expect(page.getByTestId("fullscreen-toggle")).not.toBeVisible();
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

  test("Loads the pixelkarte-farbe as background from state", async ({
    page,
  }) => {
    await page.evaluate(
      (value) => sessionStorage.setItem("swissgeo_app_state", value),
      basicMapStateFixture,
    );
    await page.goto("/en/embedded");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
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

test.describe("embedded map in iframe", () => {
  const demoPagePath = new URL(
    "../fixtures/embedded-demo.html",
    import.meta.url,
  ).pathname;

  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await page.goto(`file://${demoPagePath}`);
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("renders the embedded map inside the iframe", async ({ page }) => {
    const iframeElement = page.frameLocator("iframe");
    await expect(iframeElement.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test("displays zoom controls inside the iframe", async ({ page }) => {
    const iframeElement = page.frameLocator("iframe");
    await expect(iframeElement.getByTestId("zoom-in")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await expect(iframeElement.getByTestId("zoom-out")).toBeVisible();
  });

  test("does not display the fullscreen button inside the iframe", async ({
    page,
  }) => {
    const iframeElement = page.frameLocator("iframe");
    // wait for the map to be present first
    await expect(iframeElement.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await expect(
      iframeElement.getByTestId("fullscreen-toggle"),
    ).not.toBeVisible();
  });

  test("displays the see on swissgeo.ch button inside the iframe", async ({
    page,
  }) => {
    const iframeElement = page.frameLocator("iframe");
    await expect(
      iframeElement.getByTestId("embedded-map-viewer-view-on-swissgeo-button"),
    ).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test("see on swissgeo.ch button has the correct link", async ({ page }) => {
    const iframeElement = page.frameLocator("iframe");
    const button = iframeElement.getByTestId(
      "embedded-map-viewer-view-on-swissgeo-button",
    );
    await expect(button).toHaveAttribute(
      "href",
      "http://localhost:3000/map?state=dummyStateForTesting",
    );
  });
});
