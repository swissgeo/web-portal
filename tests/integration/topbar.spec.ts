import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

/** One location result for any query, as the geo.admin.ch search would return */
async function mockLocationSearch(page: Page) {
  await page.route("**/SearchServer**", (route) =>
    route.fulfill({
      status: 200,
      json: {
        results: [
          {
            id: 1,
            weight: 1,
            attrs: {
              label: "Biel/Bienne",
              featureId: "biel",
              detail: "biel/bienne be",
              x: 1220000,
              y: 2585000,
              zoomlevel: 10,
            },
          },
        ],
      },
    }),
  );
}

/** Coordinates of every point drawn on the map, e.g. the search crosshair */
function markedCoordinates(page: Page) {
  return page.evaluate(() =>
    window.swissgeoOlMap
      ?.getLayers()
      .getArray()
      .flatMap((layer) => {
        const source = (layer as { getSource?: () => unknown }).getSource?.();
        const features =
          (
            source as { getFeatures?: () => unknown[] } | undefined
          )?.getFeatures?.() ?? [];
        return features.map((feature) =>
          (
            feature as {
              getGeometry: () => { getCoordinates: () => number[] };
            }
          )
            .getGeometry()
            .getCoordinates(),
        );
      }),
  );
}

test.describe("topbar search", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("search input is visible in the topbar", async ({ page }) => {
    const searchInput = page.getByTestId("topbar-search-input");
    await expect(searchInput).toBeVisible();
  });

  test("search input accepts text", async ({ page }) => {
    const searchInput = page.getByRole("textbox");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("Bern");
    await expect(searchInput).toHaveValue("Bern");
  });

  test("clear button clears the search input", async ({ page }) => {
    const searchInput = page.getByRole("textbox");
    await searchInput.fill("Bern");

    const clearButton = page.getByRole("button", { name: "Clear search" });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    await expect(searchInput).toHaveValue("");
  });

  test("clicking input reopens popover after clicking outside", async ({
    page,
  }) => {
    await page.route("**/search**", (route) =>
      route.fulfill({
        status: 200,
        json: {
          results: [
            {
              id: "bern",
              title: "Bern",
              resultType: "LOCATION",
              coordinate: [2660000, 1190000],
              zoom: 10,
            },
          ],
        },
      }),
    );

    const searchInput = page.getByRole("textbox");
    await searchInput.fill("Bern");

    const results = page.getByTestId("search-results");
    await expect(results).toBeVisible({ timeout: 10_000 });

    await page.click("body");
    await expect(results).not.toBeVisible();

    await searchInput.click();
    await expect(results).toBeVisible();
  });

  test("keeps the focus in the input while typing", async ({ page }) => {
    // the results open while the user is still typing, and must not steal the
    // focus: a 4 digit postal code is enough to bring some in
    await mockLocationSearch(page);

    const searchInput = page.getByTestId("topbar-search-input");
    await searchInput.click();
    await page.keyboard.type("2600 Biel", { delay: 50 });

    await expect(page.getByTestId("search-results")).toBeVisible();
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveValue("2600 Biel");
  });

  test("arrow down moves the focus from the input to the first result", async ({
    page,
  }) => {
    await mockLocationSearch(page);

    const searchInput = page.getByTestId("topbar-search-input");
    await searchInput.click();
    await page.keyboard.type("2600 Biel", { delay: 50 });
    await expect(page.getByTestId("search-results")).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByTestId("search-result-entry-location-0"),
    ).toBeFocused();
  });

  test("a typed coordinate moves the map without any result to select", async ({
    page,
  }) => {
    await page.route("**/SearchServer**", (route) =>
      route.fulfill({ status: 200, json: { results: [] } }),
    );

    const searchInput = page.getByTestId("topbar-search-input");
    await searchInput.fill("2600000 1200000");

    await expect
      .poll(
        () => page.evaluate(() => window.swissgeoOlMap?.getView().getCenter()),
        { timeout: 15_000 },
      )
      .toEqual([2600000, 1200000]);
    // the crosshair marks the exact point
    await expect
      .poll(() => markedCoordinates(page), { timeout: 15_000 })
      .toEqual([[2600000, 1200000]]);
    // and the coordinate is not offered as a result, the map went there already
    await expect(page.getByTestId("search-results")).not.toBeVisible();
  });
});
