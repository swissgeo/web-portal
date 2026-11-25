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

  test("fits the phone width in light and dark mode", async ({ page }) => {
    const hasHorizontalScroll = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );

    // The search bar renders only on the client. Wait for it, because it is the widest element.
    await expect(page.getByTestId("mobile-search-field")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      for (const width of [320, 375, 393]) {
        await page.setViewportSize({ width, height: 844 });
        expect(
          await hasHorizontalScroll(),
          `horizontal scroll at ${width}px in ${colorScheme} mode`,
        ).toBe(false);
      }
    }
  });

  test("shows only the icon in the card buttons", async ({ page }) => {
    for (const name of ["Zur Karte", "Datenkatalog öffnen", "Zum Infoportal"]) {
      const button = page.getByRole("button", { name });
      await expect(button).toBeVisible();
      // The label is visually hidden, but screen readers still read it.
      const label = await button.getByText(name).boundingBox();
      expect(label).not.toBeNull();
      expect(label!.width).toBeLessThanOrEqual(1);
    }
  });
});
