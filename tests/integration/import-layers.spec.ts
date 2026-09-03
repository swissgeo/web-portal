import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

const wmtsCapabilities = readFileSync(
  new URL("../fixtures/WMTSCapabilities.xml", import.meta.url),
  "utf-8",
);
const wmsCapabilities = readFileSync(
  new URL("../fixtures/capabilities-wms-geoadminch.xml", import.meta.url),
  "utf-8",
);
const jpegTile = readFileSync(
  new URL("../fixtures/tile.jpeg", import.meta.url),
);
const pngTile = readFileSync(new URL("../fixtures/tile.png", import.meta.url));

const WMTS_URL =
  "https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml";
const WMS_URL =
  "https://wms.geo.admin.ch/?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
const WMTS_LAYER = "ch.swisstopo.pixelkarte-farbe";
const WMS_LAYER = "ch.swisstopo.test-wms";
const STORAGE_KEY = "swissgeo_app_state";

/**
 * Mock the external-layer import pipeline so the test stays offline. Only the
 * raw-capabilities route drives the assertions (it populates the import list);
 * the `/external/**` endpoint and tile mocks are defensive — adding a layer
 * mounts the converter pipeline, which fires those requests in the background,
 * and mocking them keeps the run hermetic and free of unmocked-request noise.
 */
async function mockExternalLayerApi(
  page: Page,
  opts: { protocol: "WMTS" | "WMS"; capabilityUrl: string },
) {
  const { protocol, capabilityUrl } = opts;

  // Raw capabilities document.
  const capabilitiesBody =
    protocol === "WMTS" ? wmtsCapabilities : wmsCapabilities;
  await page.route(capabilityUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/xml",
      body: capabilitiesBody,
    }),
  );

  // Distributions endpoint. Shapes mirror the real handlers in
  // packages/main/server/api/wpa/v1/layers/external/.
  //
  // Playwright matches the last-registered route first, so this broad glob must
  // be registered BEFORE the more specific `/dataset/` and `/service/` routes
  // (`/service/<url>` also matches `*/*`), or it would shadow them.
  await page.route("**/api/wpa/v1/layers/external/*/*", (route, request) => {
    const requestUrl = new URL(request.url());
    const parts = requestUrl.pathname.split("/");
    const layerId = parts.pop() ?? "";
    const encodedUrl = parts.pop() ?? "";
    // The distribution's `dataservice` link points at the `/service/<url>`
    // endpoint (mocked below), which `useService` follows to the capabilities.
    const serviceHref = [...parts, "service", encodedUrl].join("/");
    return route.fulfill({
      status: 200,
      json: {
        type: "FeatureCollection",
        links: [],
        features: [
          {
            id: layerId,
            links: [
              {
                href: serviceHref,
                rel: "dataservice",
              },
            ],
            properties: {
              title: layerId,
              type: "Distribution",
              protocol: protocol === "WMTS" ? "OGC:WMTS" : "OGC:WMS",
              externalIds: [layerId],
            },
          },
        ],
      },
    });
  });

  await page.route(
    "**/api/wpa/v1/layers/external/dataset/**",
    (route, request) => {
      const layerId = new URL(request.url()).pathname.split("/").pop() ?? "";
      return route.fulfill({
        status: 200,
        json: {
          id: layerId,
          links: [
            { href: request.url(), rel: "self", title: "This Record" },
            {
              href: request.url().replace("/dataset/", "/"),
              rel: "distributions",
              title: "Distributions",
              type: "application/json",
            },
          ],
          properties: { title: layerId, type: "Dataset" },
        },
      });
    },
  );

  await page.route("**/api/wpa/v1/layers/external/service/**", (route) =>
    route.fulfill({
      status: 200,
      json: {
        id: capabilityUrl,
        links: [
          {
            href: capabilityUrl,
            rel: "describedby",
            type: "application/xml",
            title: "Capability",
          },
        ],
      },
    }),
  );

  // Tiles.
  await page.route("https://wmts.geo.admin.ch/1.0.0/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/jpeg", body: jpegTile }),
  );
  await page.route("https://wms.geo.admin.ch/**", (route) => {
    const url = route.request().url();
    if (url.includes("GetMap")) {
      return route.fulfill({
        status: 200,
        contentType: "image/png",
        body: pngTile,
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/xml",
      body: wmsCapabilities,
    });
  });
}

test.describe("import external layers", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  async function openMap(page: Page) {
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.waitForFunction(() => window.swissgeoOlMap !== undefined, null, {
      timeout: 20_000,
    });
  }

  test("imports a geoadmin WMTS layer", async ({ page }) => {
    await mockExternalLayerApi(page, {
      protocol: "WMTS",
      capabilityUrl: WMTS_URL,
    });
    await openMap(page);

    await page.getByTestId("debug-open-import-layers-panel").click();
    await page.getByTestId("import-capability-url").fill(WMTS_URL);
    await page.getByTestId("import-load-capabilities").click();

    const layerButton = page.getByTestId(`import-layer-${WMTS_LAYER}`);
    await expect(layerButton).toBeVisible();
    await layerButton.click();

    // The imported layer shows up in the "Aktive Ebenen" sidebar (the cart
    // entry's displayName contains the layer id).
    await page.getByTestId("button-layer-cart-panel").click();
    await expect(
      page.getByTestId("layer-cart").getByText(WMTS_LAYER),
    ).toBeVisible();
  });

  test("imports a geoadmin WMS layer", async ({ page }) => {
    await mockExternalLayerApi(page, {
      protocol: "WMS",
      capabilityUrl: WMS_URL,
    });
    await openMap(page);

    await page.getByTestId("debug-open-import-layers-panel").click();
    await page.getByTestId("import-capability-url").fill(WMS_URL);
    await page.getByTestId("import-load-capabilities").click();

    const layerButton = page.getByTestId(`import-layer-${WMS_LAYER}`);
    await expect(layerButton).toBeVisible();
    await layerButton.click();

    await page.getByTestId("button-layer-cart-panel").click();
    await expect(
      page.getByTestId("layer-cart").getByText(WMS_LAYER),
    ).toBeVisible();
  });

  test("removes a layer when its distribution cannot be loaded", async ({
    page,
  }) => {
    const workingLayer = "test-drawing.geojson";
    const failedLayerUrl = "http://mock-oar.org/dataset-without-distributions";
    const state = btoa(
      JSON.stringify({
        version: "1.0",
        state: {
          layers: [
            {
              layerUrl: failedLayerUrl,
              type: "dataset",
              isVisible: false,
              opacity: 0.4,
            },
          ],
          bg_layer: null,
        },
      }),
    );
    await page.route(failedLayerUrl, (route) =>
      route.fulfill({
        status: 200,
        json: {
          id: WMTS_LAYER,
          links: [{ href: failedLayerUrl, rel: "self" }],
          properties: { title: WMTS_LAYER, type: "Dataset" },
        },
      }),
    );
    await page.goto(`/de/map?state=${encodeURIComponent(state)}`);

    await expect(
      page.getByText("Die Ebene konnte nicht geladen werden.", { exact: true }),
    ).toBeVisible();
    await page.getByTestId("button-layer-cart-panel").click();
    const layerCart = page.getByTestId("layer-cart");
    await expect(layerCart.getByText(WMTS_LAYER)).toHaveCount(0);
    await page.getByTestId("button-layer-cart-panel").click();

    await page.getByTestId("debug-open-import-local-panel").click();
    await page
      .getByTestId("file-input")
      .setInputFiles(
        fileURLToPath(new URL(`../fixtures/${workingLayer}`, import.meta.url)),
      );
    await page.getByTestId("file-import-button").click();
    await page.getByTestId("file-import-close-button").click();

    await expect
      .poll(
        () =>
          page.evaluate(
            (storageKey) =>
              JSON.parse(sessionStorage.getItem(storageKey) ?? "null")?.state
                ?.layers?.[0]?.type ?? null,
            STORAGE_KEY,
          ),
        { timeout: HYDRATION_TIMEOUT },
      )
      .toBe("geojson");
    const workingLayerRemains = await page.evaluate(
      (layerId) =>
        window.swissgeoOlMap
          ?.getLayers()
          .getArray()
          .some((layer) => layer.get("id") === layerId) ?? false,
      workingLayer,
    );
    expect(workingLayerRemains).toBe(true);
  });

  test("preset dropdown loads the layer list", async ({ page }) => {
    await mockExternalLayerApi(page, {
      protocol: "WMTS",
      capabilityUrl: WMTS_URL,
    });
    await openMap(page);

    await page.getByTestId("debug-open-import-layers-panel").click();
    await page.getByTestId("import-preset-toggle").click();
    await page
      .getByRole("button", { name: "geo.admin — WMTS (EPSG:2056)" })
      .click();

    await expect(page.getByTestId(`import-layer-${WMTS_LAYER}`)).toBeVisible();
  });
});
