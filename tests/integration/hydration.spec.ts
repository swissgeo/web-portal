import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

test.afterEach(async ({ page }) => {
  await cleanupExternalRequestMocks(page);
});

// The server does not know the viewport width. The first client render must
// match the server render at every width (GPS-1300).
test.describe("map page hydration", () => {
  test("logs no hydration mismatch on a desktop", async ({ page }) => {
    const hydrationMessages: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("Hydration")) {
        hydrationMessages.push(message.text());
      }
    });
    await mockExternalRequests(page).mockAll();

    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });

    expect(hydrationMessages).toEqual([]);
  });
});
