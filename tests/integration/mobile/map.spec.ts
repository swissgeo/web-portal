import { expect, test } from "@playwright/test";

import {
  cleanupExternalRequestMocks,
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  mockMapBackground,
} from "../setup";
import {
  dismissToasts,
  mockCatalogList,
  mockLocationSearch,
  mockThesaurus,
} from "./helpers";

test.describe("mobile map flows", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await mockMapBackground(page);
    await mockCatalogList(page);
    await mockLocationSearch(page);
    await mockThesaurus(page);
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await dismissToasts(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("searches for a layer", async ({ page }) => {
    await page.getByTestId("mobile-search-button").tap();

    const input = page.getByTestId("mobile-search-input");
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await page.keyboard.type("pixelkarte");

    await expect(page.getByTestId("search-results")).toBeVisible({
      timeout: 15_000,
    });
    const layerResult = page.getByTestId("search-result-entry-layer-0");
    await expect(layerResult).toBeVisible();
    await expect(layerResult).toHaveText(/\S/);

    await page.keyboard.press("Escape");
    await expect(input).toBeHidden();
  });

  test("adds a layer and opens the map panel", async ({ page }) => {
    await page.getByTestId("mobile-search-button").tap();
    await page.keyboard.type("pixelkarte");

    const layerResult = page.getByTestId("search-result-entry-layer-0");
    await expect(layerResult).toBeVisible({ timeout: 15_000 });
    await dismissToasts(page);
    await layerResult.tap();
    await expect(page.getByTestId("mobile-search-input")).toBeHidden();

    await page.getByTestId("footer-nav-map").tap();

    const layerCart = page.getByTestId("layer-cart");
    await expect(layerCart).toBeVisible({ timeout: 15_000 });
    await expect(layerCart).toHaveText(/\S/);

    await page.getByTestId("footer-nav-map").tap();
    await expect(layerCart).toBeHidden();
  });

  test("opens and closes the dataset detail view", async ({ page }) => {
    await page.getByTestId("footer-nav-catalog").tap();

    await expect(page.getByTestId("catalog-table")).toBeVisible({
      timeout: 15_000,
    });
    const infoButton = page.getByTestId("catalog-layer-info").first();
    await expect(infoButton).toBeVisible();
    await dismissToasts(page);

    await infoButton.tap();

    await expect(page).toHaveURL(/\/de\/dataset\/dat_pixelkarte-farbe/);

    const panel = page.getByTestId("dataset-panel");
    await expect(panel).toBeVisible();

    const title = page.getByTestId("dataset-title");
    await expect(title).toBeVisible();
    await expect(title).toHaveText(/\S/, { timeout: 15_000 });

    await page.getByTestId("dataset-close").tap();

    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/\/de\/map$/);
  });
});
