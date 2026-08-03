import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

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

  test("typing in search input opens popover with results", async ({
    page,
  }) => {
    const searchInput = page
      .getByTestId("topbar-search-input")
      .locator("input");
    await searchInput.fill("Bern");

    const results = page.getByTestId("search-results");
    await expect(results).toBeVisible({ timeout: 10_000 });
  });

  test("clear button clears the search", async ({ page }) => {
    const searchInput = page
      .getByTestId("topbar-search-input")
      .locator("input");
    await searchInput.fill("Bern");

    const clearButton = page.getByRole("button", { name: "Clear search" });
    await clearButton.click();

    await expect(searchInput).toHaveValue("");
  });
});
