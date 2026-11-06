import { expect, test } from "@playwright/test";

import ChSwisstopoPixelkarteFarbeDataset from "../fixtures/item-dataset-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import ChSwisstopoPixelkarteFarbeDistribution from "../fixtures/item-distribution-ch.swisstopo.pixelkarte-farbe.json" with { type: "json" };
import {
  HYDRATION_TIMEOUT,
  cleanupExternalRequestMocks,
  mockExternalRequests,
} from "./setup";

test.describe("dataset detail panel", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("scrolls only the tab content, not the header and tab list beside it", async ({
    page,
  }) => {
    // A long description makes the content overflow, so the scroller gets a
    // scrollbar that must not run alongside the header and the tab list
    const dataset = {
      ...ChSwisstopoPixelkarteFarbeDataset,
      properties: {
        ...ChSwisstopoPixelkarteFarbeDataset.properties,
        description: `${
          ChSwisstopoPixelkarteFarbeDataset.properties.description
        } ${"Eine lange Beschreibung. ".repeat(200)}`,
      },
    };
    // The catalog search of the topbar lists the dataset as a layer result
    await page.route(
      "http://oar.test/api/oar/collections/swissgeo-catalog/items?*",
      (route) =>
        route.fulfill({
          status: 200,
          json: { type: "FeatureCollection", features: [dataset], links: [] },
        }),
    );
    // The dataset page fetches the record itself, client-side like the search
    await page.route(
      "http://oar.test/api/oar/collections/swissgeo-catalog/items/ch.swisstopo.pixelkarte-farbe*",
      (route) => route.fulfill({ status: 200, json: dataset }),
    );
    await page.route(
      "http://oar.test/api/oar/collections/swissgeo-distributions/items/ch.swisstopo.pixelkarte-farbe*",
      (route) =>
        route.fulfill({
          status: 200,
          json: ChSwisstopoPixelkarteFarbeDistribution,
        }),
    );

    await page.goto("/de/map");
    await expect(page.getByTestId("topbar-search-input")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.getByTestId("topbar-search-input").fill("pixelkarte");
    // The info button of the layer result opens the dataset detail
    await page.getByTestId("search-result-info-0").click();
    await expect(page).toHaveURL(/\/de\/dataset\//);

    // The map page with its own panel stays mounted behind the dataset, so
    // the locators scope to the panel that holds the dataset content
    const fixed = page.getByTestId("panel-fixed").filter({
      has: page.getByTestId("dataset-title"),
    });
    const scroller = page.getByTestId("panel-scroller").filter({
      has: page.locator('[role="tabpanel"]'),
    });
    await expect(fixed.getByTestId("dataset-title")).toBeVisible();

    // The header and the tab list sit in the fixed area, the panels scroll.
    // The role locator would miss the hidden panels of the inactive tabs.
    await expect(fixed.getByRole("tablist")).toBeVisible();
    await expect(scroller.locator('[role="tabpanel"]')).toHaveCount(4);
    await expect(scroller.getByTestId("dataset-title")).toHaveCount(0);
    await expect(scroller.getByRole("tablist")).toHaveCount(0);
    // The header comes before the tab list
    expect(
      await fixed.evaluate((element) => {
        const header = element.querySelector("header");
        const tabList = element.querySelector('[role="tablist"]');
        return (
          header !== null &&
          tabList !== null &&
          (header.compareDocumentPosition(tabList) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0
        );
      }),
    ).toBe(true);

    // Expanding the long description makes the content overflow the panel,
    // so the scrollbar shows next to the scrolling content only
    await page.getByTestId("dataset-description-toggle").click();
    await expect
      .poll(() =>
        scroller.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(true);
  });
});
