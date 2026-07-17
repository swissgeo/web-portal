import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";
import { readFileSync } from "fs";

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

/**
 * Mock everything the external-layer import pipeline touches so the test never
 * reaches the real geo.admin service:
 *  - the raw capabilities document (fetched browser-side by the panel and by
 *    the ogc composables),
 *  - our own `/api/wpa/v1/layers/external/**` endpoints (browser -> Nuxt),
 *    short-circuiting their server-side geo.admin fetch,
 *  - the map tiles.
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

  // Synthetic OGC record served by our own endpoints. Shapes mirror the real
  // handlers in packages/main/server/api/wpa/v1/layers/external/.
  //
  // Playwright matches the LAST-registered route first, so the broad
  // distributions glob (`.../external/<url>/<layer>`) must be registered
  // BEFORE the more specific `/dataset/` and `/service/` routes — otherwise it
  // would shadow them (e.g. `/service/<url>` also matches `*/*`).
  await page.route("**/api/wpa/v1/layers/external/*/*", (route, request) => {
    const parts = request.url().split("/");
    const layerId = parts.pop() ?? "";
    const encodedUrl = parts.pop() ?? "";
    // Mirror the real handler: the distribution's `dataservice` link points at
    // the `/service/<encodedUrl>` endpoint (mocked below), which `useService`
    // fetches to resolve the capability document.
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
      const layerId = request.url().split("/").pop() ?? "";
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
            rel: "about",
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

    // The imported layer shows up in the "Aktive Ebenen" sidebar (the
    // layer-cart entry renders the layer's displayName, which contains the
    // layer id).
    await page.getByRole("button", { name: "Aktive Ebenen" }).click();
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

    await page.getByRole("button", { name: "Aktive Ebenen" }).click();
    await expect(
      page.getByTestId("layer-cart").getByText(WMS_LAYER),
    ).toBeVisible();
  });

  test("preset dropdown loads the layer list", async ({ page }) => {
    await mockExternalLayerApi(page, {
      protocol: "WMTS",
      capabilityUrl: WMTS_URL,
    });
    await openMap(page);

    await page.getByTestId("debug-open-import-layers-panel").click();
    await page.locator('[title="Preset capability URLs"]').click();
    await page
      .getByRole("button", { name: "geo.admin — WMTS (EPSG:2056)" })
      .click();

    await expect(page.getByTestId(`import-layer-${WMTS_LAYER}`)).toBeVisible();
  });
});
