import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

// The mobile UI is off by default (featureFlags.enableMobileUi), so phones
// get the scaled desktop UI and the mobile notice.
// The notice checks the screen size. Set the screen together with the
// viewport, because the Desktop Chrome device sets a 1920x1080 screen.
const PORTRAIT_PHONE = { width: 390, height: 844 };
const LANDSCAPE_PHONE = { width: 844, height: 390 };

async function openMap(page: Page) {
  await mockExternalRequests(page).mockAll();
  await page.goto("/de/map");
  await expect(page.getByTestId("ol-map")).toBeVisible({
    timeout: HYDRATION_TIMEOUT,
  });
}

function mobileNotice(page: Page) {
  return page.getByRole("dialog", { name: "Mobile Ansicht folgt" });
}

test.afterEach(async ({ page }) => {
  await cleanupExternalRequestMocks(page);
});

test.describe("mobile notice on a portrait phone", () => {
  test.use({
    viewport: PORTRAIT_PHONE,
    screen: PORTRAIT_PHONE,
    isMobile: true,
    hasTouch: true,
  });

  test("shows the desktop UI scaled down and the notice", async ({ page }) => {
    await openMap(page);

    await expect(mobileNotice(page)).toBeVisible();
    await expect(mobileNotice(page)).toBeFocused();
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      "width=1280, interactive-widget=resizes-content",
    );
    expect(await page.evaluate(() => window.innerWidth)).toBe(1280);
    await expect(
      page.getByRole("button", { name: "Menü öffnen" }),
    ).toBeHidden();
  });

  test("stays closed after a reload once dismissed", async ({ page }) => {
    await openMap(page);

    await page.getByTestId("mobile-notice-confirm").click();
    await expect(mobileNotice(page)).toBeHidden();

    await page.reload();
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await expect(mobileNotice(page)).toBeHidden();
  });
});

test.describe("mobile notice on a landscape phone", () => {
  test.use({
    viewport: LANDSCAPE_PHONE,
    screen: LANDSCAPE_PHONE,
    isMobile: true,
    hasTouch: true,
  });

  test("keeps the confirm button reachable", async ({ page }) => {
    await openMap(page);

    const confirm = page.getByTestId("mobile-notice-confirm");
    await confirm.scrollIntoViewIfNeeded();
    await expect(confirm).toBeInViewport();
    await confirm.click();
    await expect(mobileNotice(page)).toBeHidden();
  });
});

test.describe("mobile notice on a desktop", () => {
  test("is not shown", async ({ page }) => {
    await openMap(page);

    await expect(mobileNotice(page)).toBeHidden();
  });
});
