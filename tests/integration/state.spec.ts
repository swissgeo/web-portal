import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

const STORAGE_KEY = "swissgeo_app_state";

const noBackgroundStateStr = btoa(
  JSON.stringify({
    version: "1.0",
    state: {
      layers: [],
    },
  }),
);

async function expectNoBackground(page: Page) {
  await expect(page.getByTestId("ol-map")).toBeVisible({
    timeout: HYDRATION_TIMEOUT,
  });

  await expect
    .poll(
      async () =>
        page.evaluate(
          () => window.swissgeoOlMap?.getLayers().getArray().length ?? null,
        ),
      { timeout: HYDRATION_TIMEOUT },
    )
    .toBe(0);

  await expect(page.getByTestId("background-selector-void")).toBeVisible();
}

async function expectNoBackgroundStatePersisted(page: Page) {
  await expect
    .poll(
      async () =>
        page.evaluate((storageKey) => {
          const storedState = sessionStorage.getItem(storageKey);
          if (!storedState) {
            return null;
          }
          const layers = JSON.parse(storedState)?.state?.layers;
          return Array.isArray(layers) ? layers.length : null;
        }, STORAGE_KEY),
      { timeout: HYDRATION_TIMEOUT },
    )
    .toBe(0);
}

test.describe("state loading", () => {
  // The assertions use HYDRATION_TIMEOUT, so the test timeout must outlive it.
  // Otherwise Playwright can fail before the app hydration wait finishes.
  test.describe.configure({ timeout: HYDRATION_TIMEOUT * 2 });

  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("loads no background if the state demands it", async ({ page }) => {
    await page.goto("/de/map?statestr=" + noBackgroundStateStr);

    await expectNoBackground(page);
  });

  test("restores persisted session state after navigation", async ({ page }) => {
    await page.goto("/de/map?statestr=" + noBackgroundStateStr);
    await expectNoBackground(page);
    await expectNoBackgroundStatePersisted(page);

    // Drop statestr so the second restore can only come from sessionStorage.
    // Otherwise the URL import would hide a broken session restore.
    await page.goto("/de/map");

    await expectNoBackground(page);
  });
});
