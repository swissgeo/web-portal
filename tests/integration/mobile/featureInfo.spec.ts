import { expect, test } from "@playwright/test";

import ChSwisstopoPixelkarteFarbeDistribution from "../../fixtures/item-distribution-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import {
  cleanupExternalRequestMocks,
  dismissToasts,
  HYDRATION_TIMEOUT,
  mockCatalogList,
  mockExternalRequests,
  mockLocationSearch,
  mockMapBackground,
  mockThesaurus,
} from "../setup";

const IDENTIFY_BASE_URL = "http://identify.test/rest";

// The pixelkarte layer gets an identify service that finds one feature anywhere
async function mockFeatureInfo(page: Parameters<typeof mockMapBackground>[0]) {
  const distributions = structuredClone(ChSwisstopoPixelkarteFarbeDistribution);
  distributions.features[0]!.links.push({
    href: "http://oar.test/featureinfo",
    rel: "featureinfo",
  } as (typeof distributions.features)[0]["links"][0]);
  await page.route(
    "http://oar.test/api/oar/collections/swissgeo-distributions/items/ch.swisstopo.pixelkarte-farbe",
    (route) => route.fulfill({ status: 200, json: distributions }),
  );
  await page.route("http://oar.test/featureinfo", (route) =>
    route.fulfill({
      status: 200,
      json: {
        id: "featureinfo",
        properties: { protocol: "geoadmin:features", externalIds: ["test"] },
        links: [{ rel: "dataservice", href: "http://oar.test/dataservice" }],
      },
    }),
  );
  await page.route("http://oar.test/dataservice", (route) =>
    route.fulfill({
      status: 200,
      json: { links: [{ rel: "describes", href: IDENTIFY_BASE_URL }] },
    }),
  );
  await page.route(`${IDENTIFY_BASE_URL}/identify?**`, (route) =>
    route.fulfill({
      status: 200,
      json: {
        results: [
          {
            id: 1,
            geometry: { type: "Point", coordinates: [2600000, 1200000] },
            properties: { label: "Bern" },
          },
        ],
      },
    }),
  );
  await page.route(`${IDENTIFY_BASE_URL}/test/1/htmlPopup?**`, (route) =>
    route.fulfill({ status: 200, body: "<p>Feature content</p>" }),
  );
}

test.describe("mobile feature info", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "dev_feature_flags",
        value: JSON.stringify({ enableFeatureInfo: true }),
        url: "http://localhost:3000",
      },
    ]);
    await mockExternalRequests(page).mockAll();
    await mockMapBackground(page);
    await mockCatalogList(page);
    await mockLocationSearch(page);
    await mockThesaurus(page);
    await mockFeatureInfo(page);
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await dismissToasts(page);

    await page.getByTestId("mobile-search-button").tap();
    await page.keyboard.type("pixelkarte");
    const layerResult = page.getByTestId("search-result-entry-layer-0");
    await expect(layerResult).toBeVisible({ timeout: 15_000 });
    // A slow map load can show an error toast above the result at any time
    await expect(async () => {
      await dismissToasts(page);
      await layerResult.tap({ timeout: 2_000 });
    }).toPass();
    await expect(page.getByTestId("mobile-search-input")).toBeHidden();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("opens on a tap on the map and closes with the close button", async ({
    page,
  }) => {
    await page.getByTestId("ol-map").tap();

    const sections = page.getByTestId("feature-info-sections");
    await expect(sections).toBeVisible({ timeout: 15_000 });
    await expect(sections).toContainText("Bern");

    await page
      .getByRole("dialog", { name: "Objektinformationen" })
      .locator('[data-slot="close"]')
      .tap();
    await expect(sections).toBeHidden();
  });
});
