import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

test.describe("state sharing", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await page.goto("/en/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("generates a share link", async ({ page }) => {
    const stateConfigButton = page.getByTestId("debug-open-state-config-panel");
    await stateConfigButton.click();
  });
});
