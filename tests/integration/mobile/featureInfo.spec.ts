import { expect, test } from "@playwright/test";

import {
  cleanupExternalRequestMocks,
  dismissToasts,
  HYDRATION_TIMEOUT,
  mockCatalogList,
  mockExternalRequests,
  mockFeatureInfo,
  mockLocationSearch,
  mockMapBackground,
  mockThesaurus,
} from "../setup";

test.describe("mobile feature info", () => {
  test.beforeEach(async ({ page }) => {
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
