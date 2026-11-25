import { expect, test } from "@playwright/test";

import {
  cleanupExternalRequestMocks,
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  mockMapBackground,
} from "../setup";

test.describe("mobile menu", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await mockMapBackground(page);
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("opens and closes the menu", async ({ page }) => {
    await page.getByRole("button", { name: "Menü öffnen" }).tap();

    const menu = page.getByRole("dialog");
    await expect(menu.getByText("Menü", { exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Startseite" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Karte" })).toBeVisible();

    await menu.getByRole("button", { name: "Menü schliessen" }).tap();

    await expect(menu).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Menü öffnen" }),
    ).toBeVisible();
  });

  test("closes the menu when an entry opens another page", async ({ page }) => {
    await page.getByRole("button", { name: "Menü öffnen" }).tap();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: "Startseite" })
      .tap();

    await expect(page).toHaveURL(/\/de$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
