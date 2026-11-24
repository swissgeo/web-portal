import { expect, test } from "@playwright/test";

import {
  cleanupExternalRequestMocks,
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  mockMapBackground,
} from "../setup";

test.describe("mobile landing page", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await mockMapBackground(page);
    await page.goto("/de");
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("shows the landing content and opens the map", async ({ page }) => {
    const claim = page.getByTestId("landing-claim");
    await expect(claim).toBeVisible();
    await expect(claim).toHaveText(/\S/);

    const searchField = page.getByTestId("mobile-search-field");
    await expect(searchField).toBeVisible({ timeout: HYDRATION_TIMEOUT });
    await expect(searchField).toHaveText(/\S/);

    const mapButton = page.getByTestId("landing-map-button");
    await expect(mapButton).toBeVisible();
    await expect(mapButton).toHaveText(/\S/);

    await mapButton.tap();

    await expect(page).toHaveURL(/\/de\/map$/);
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });
});
