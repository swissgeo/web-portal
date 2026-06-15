import type { Page } from "@playwright/test";
import type { Map as OlMapType } from "ol";

declare global {
  interface Window {
    swissgeoOlMap?: OlMapType;
  }
}

// olmap takes a while to load, since the headless browser is slower
export const HYDRATION_TIMEOUT = 50_000;

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
    await page.route("http://mock-oar.org/**", (route) =>
      route.fulfill({ status: 200, json: { collections: [], links: [] } }),
    );
  };

  /**
   * Mock the requests to the livingdocs API
   *
   *  ATTENTION: this will probably not work for SSR rendered pages in tests
   */
  const mockLivingdocs = async () => {
    await page.route("http://mock-livingdocs.org/**", (route) =>
      route.fulfill({ status: 200 }),
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
  };

  return {
    mockAll,
    mockOar,
    mockLivingdocs,
    mockCatchAll,
  };
}

export async function cleanupExternalRequestMocks(page: Page) {
  await page.unrouteAll({ behavior: "wait" });
}
