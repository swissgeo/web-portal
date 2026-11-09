import type { Locator } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  cleanupExternalRequestMocks,
  HYDRATION_TIMEOUT,
  mockExternalRequests,
} from "./setup";

// The first word is longer than the sidebar is wide (GPS-1339).
const LONG_TITLE =
  "Abwasserreinigungsanlagenkanalisationsnetzverzeichnisdatensatz der Schweiz.geojson";

/** The text of each line the browser rendered, from top to bottom. */
const renderedLines = (element: Locator) =>
  element.evaluate((el) => {
    const text = el.firstChild!;
    const lines = new Map<number, string>();
    for (let i = 0; i < text.textContent!.length; i++) {
      const range = document.createRange();
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0) {
        continue;
      }
      const top = Math.round(rect.top);
      lines.set(top, (lines.get(top) ?? "") + text.textContent![i]);
    }
    return [...lines.values()].map((line) => line.trim()).filter(Boolean);
  });

test.describe("layer cart entry", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.getByRole("button", { name: "Debug", exact: true }).click();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("wraps a long first word of an expanded title off the row icons", async ({
    page,
  }) => {
    await page.getByTestId("debug-open-import-local-panel").click();
    await page.getByTestId("file-input").setInputFiles({
      name: LONG_TITLE,
      mimeType: "application/geo+json",
      buffer: Buffer.from('{"type": "FeatureCollection", "features": []}'),
    });
    await page.getByTestId("file-import-button").click();
    await page.getByTestId("file-import-close-button").click();

    const name = page
      .getByTestId("layer-cart")
      .getByRole("button", { name: LONG_TITLE, exact: true });
    await expect(name).toBeVisible();

    // A newly added layer opens expanded (GPS-1347).
    const lines = await renderedLines(name);
    expect(lines.length).toBeGreaterThan(1);
    expect(LONG_TITLE.startsWith(lines[0]!)).toBe(true);
    expect(lines[0]).not.toBe(LONG_TITLE);
    expect(LONG_TITLE.endsWith(lines.at(-1)!)).toBe(true);

    const nameBox = (await name.boundingBox())!;
    const iconsBox = (await name
      .locator("xpath=following-sibling::div[1]")
      .boundingBox())!;
    expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(iconsBox.x);

    await name.click();

    expect(await renderedLines(name)).toHaveLength(1);
  });
});
