import type { Page } from "@playwright/test";

import ChSwisstopoPixelkarteFarbeDataset from "../../fixtures/item-dataset-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };

/**
 * The catalog list request has a query string, while the item requests do not.
 * A glob with `?` would also match the item paths, so match the query itself.
 */
export async function mockCatalogList(page: Page) {
  await page.route(/\/swissgeo-catalog\/items\?/, (route) =>
    route.fulfill({
      status: 200,
      json: {
        type: "FeatureCollection",
        features: [ChSwisstopoPixelkarteFarbeDataset],
        links: [],
        numberMatched: 1,
      },
    }),
  );
}

export async function mockLocationSearch(page: Page) {
  await page.route("**/SearchServer**", (route) =>
    route.fulfill({ status: 200, json: { results: [] } }),
  );
}

export async function mockThesaurus(page: Page) {
  await page.route("http://thesaurus.test/**", (route) =>
    route.fulfill({
      status: 200,
      json: { thesaurus_id: "ech0166", concepts: [] },
    }),
  );
}

/**
 * The map reports a missing background with a persisting toast. It is not part
 * of these flows and would cover the search results, so close it if it shows.
 */
export async function dismissToasts(page: Page) {
  const close = page.locator('[data-slot="root"] [data-slot="close"]');
  if (await close.count()) {
    await close.first().click();
  }
}
