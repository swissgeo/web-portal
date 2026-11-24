import type { Page, Route } from "@playwright/test";
import type { Map as OlMapType } from "ol";

import { readFileSync } from "fs";

import ChSwisstopoPixelkarteFarbeDataset from "../fixtures/item-dataset-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChSwisstopoPixelkarteFarbeDistribution from "../fixtures/item-distribution-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChWmtsGeoadmin from "../fixtures/wmts-geoadminch.json" with { type: "json" };

declare global {
  interface Window {
    swissgeoOlMap?: OlMapType;
  }
}

// olmap takes a while to load, since the headless browser is slower
export const HYDRATION_TIMEOUT = 50_000;

const WMTSCapabilities = readFileSync(
  new URL("../fixtures/WMTSCapabilities.xml", import.meta.url),
  "utf-8",
);

const tileFixture = readFileSync(
  new URL("../fixtures/tile.jpeg", import.meta.url),
);

/**
 * Mock external API requests so integration tests don't depend on real
 * services.
 * Provide the possibility to mock either all Requests with mockAll
 * or individual ones, in case the endpoints should return something to tests
 */
export function mockExternalRequests(page: Page) {
  /**
   * Mock the requests to the OGC API
   *
   * The env setting of playwright configures a mocked API for the OGC records.
   * By default, we make it return with a 200 and no content
   */
  const mockOar = async () => {
    await page.route("http://oar.test/**", (route) =>
      route.fulfill({
        status: 200,
        json: { collections: [], features: [], links: [] },
      }),
    );
  };

  /**
   * Mock the requests to the livingdocs API
   *
   *  ATTENTION: this will probably not work for SSR rendered pages in tests
   */
  const mockLivingdocs = async () => {
    await page.route("http://livingdocs.test/**", (route) =>
      route.fulfill({ status: 200 }),
    );
  };

  /**
   * Mock the CMS content search, which the browser reaches through our own
   * Nitro proxy rather than calling Livingdocs directly
   */
  const mockContentSearch = async (
    results: {
      documentId: string;
      title: string;
      description?: string;
      slug?: string;
      locale?: string;
    }[] = [],
  ) => {
    await page.route("**/api/wpa/v1/content/search**", (route) =>
      route.fulfill({ status: 200, json: { results } }),
    );
  };

  /**
   * This is a catch-all route to warn about unmocked routes
   * It should only be triggered by fetch/xhr requests, all the asset loading should
   * of course not be warned about
   */
  const mockCatchAll = async () => {
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      const url = route.request().url();

      if (["fetch", "xhr"].includes(type)) {
        // eslint-disable-next-line no-console
        console.warn("Unmocked API request:", url);
      }

      return route.continue();
    });
  };

  /**
   * Just a wrapper/container to mock everything at once
   */
  const mockAll = async () => {
    // ATTENTION: the priority is reversed: the first route is matched last,
    // the last registered one has the highest priority
    await mockCatchAll();
    await mockOar();
    await mockLivingdocs();
    await mockContentSearch();
  };

  return {
    mockAll,
    mockOar,
    mockLivingdocs,
    mockContentSearch,
    mockCatchAll,
  };
}

export async function cleanupExternalRequestMocks(page: Page) {
  await page.unrouteAll({ behavior: "wait" });
}

/**
 * Mock the map background and the WMTS service of the pixelkarte layer, so the
 * map renders and an added layer survives the WMTS capabilities loading.
 */
export async function mockMapBackground(page: Page) {
  const mockBackgroundResponse = (route: Route) =>
    route.fulfill({ status: 200, json: ChSwisstopoPixelkarteFarbeDataset });

  await page.route(
    "http://oar.test/api/oar/collections/geoadmin.services/items/wmts-geoadminch",
    (route) => route.fulfill({ status: 200, json: ChWmtsGeoadmin }),
  );

  await page.route(
    "http://oar.test/api/oar/collections/swissgeo-distributions/items/ch.swisstopo.pixelkarte-farbe",
    (route) =>
      route.fulfill({
        status: 200,
        json: ChSwisstopoPixelkarteFarbeDistribution,
      }),
  );

  await page.route(
    "http://oar.test/api/oar/collections/swissgeo-catalog/items/dat_*",
    mockBackgroundResponse,
  );

  await page.route(
    "https://wmts.geo.admin.ch/**/WMTSCapabilities.xml*",
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/xml",
        body: WMTSCapabilities,
      }),
  );

  await page.route("https://wmts.geo.admin.ch/1.0.0/**.jpeg", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/jpeg",
      body: tileFixture,
    }),
  );
}

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
