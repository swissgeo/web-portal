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
    await page.route("**/SearchServer**", (route) =>
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

  test("CMS results are listed in the content pages tab", async ({ page }) => {
    await mockExternalRequests(page).mockContentSearch([
      { documentId: "42", title: "Über uns" },
    ]);

    await page.getByRole("textbox").fill("uns");

    const contentTab = page.getByRole("tab", { name: "Inhaltsseiten" });
    await expect(contentTab).toBeVisible({ timeout: 10_000 });
    await contentTab.click();

    const contentResults = page.getByTestId("content-search-results");
    await expect(contentResults).toContainText("Über uns");
  });
});
