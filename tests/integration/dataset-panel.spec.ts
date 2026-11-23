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
      "http://oar.test/api/oar/collections/swissgeo-catalog/items/dat_pixelkarte-farbe*",
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
    // The input is in the server HTML, the map only shows once hydrated
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.getByTestId("topbar-search-input").fill("pixelkarte");
    // The info button of the layer result opens the dataset detail
    await page.getByTestId("search-result-info-0").click();
    await expect(page).toHaveURL(/\/de\/dataset\//);

    const panel = page.getByTestId("dataset-panel");
    const header = panel.locator("header");
    const tabList = panel.getByRole("tablist");
    // The role locator would miss the hidden panels of the inactive tabs
    const tabPanels = panel.locator('[role="tabpanel"]');
    const activeTabPanel = panel.locator('[role="tabpanel"]:not([hidden])');
    await expect(panel.getByTestId("dataset-title")).toBeVisible();

    // The header and the tab list stay outside the scrolling tab panels
    await expect(tabList).toBeVisible();
    await expect(tabPanels).toHaveCount(4);
    await expect(tabPanels.getByTestId("dataset-title")).toHaveCount(0);
    await expect(tabPanels.getByRole("tablist")).toHaveCount(0);

    // Expanding the long description makes the tab content overflow
    await page.getByTestId("dataset-description-toggle").click();
    await expect
      .poll(() =>
        activeTabPanel.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        ),
      )
      .toBe(true);

    // Only the tab content scrolls, so its scrollbar starts below the tab
    // list. The panel around it does not scroll.
    expect(
      await activeTabPanel.evaluate(
        (element) => getComputedStyle(element).overflowY,
      ),
    ).toBe("auto");
    expect(
      await panel.evaluate(
        (element) => element.scrollHeight <= element.clientHeight,
      ),
    ).toBe(true);
    const headerBox = await header.boundingBox();
    const tabListBox = await tabList.boundingBox();
    const tabPanelBox = await activeTabPanel.boundingBox();
    expect(tabListBox!.y).toBeGreaterThanOrEqual(
      headerBox!.y + headerBox!.height,
    );
    expect(tabPanelBox!.y).toBeGreaterThanOrEqual(
      tabListBox!.y + tabListBox!.height,
    );

    // Scrolling the content leaves the header and the tab list in place
    await activeTabPanel.evaluate((element) => element.scrollTo(0, 500));
    expect(
      await activeTabPanel.evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(0);
    expect((await tabList.boundingBox())!.y).toBe(tabListBox!.y);
  });
});

// Without isMobile the page keeps its 390px layout viewport, so the mobile
// layout shows even while featureFlags.enableMobileUi is off
test.describe("dataset detail panel on a phone", () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    // The catalog search of the topbar lists the dataset as a layer result
    await page.route(
      "http://oar.test/api/oar/collections/swissgeo-catalog/items?*",
      (route) =>
        route.fulfill({
          status: 200,
          json: {
            type: "FeatureCollection",
            features: [ChSwisstopoPixelkarteFarbeDataset],
            links: [],
          },
        }),
    );
    // The dataset page fetches the record itself, client-side like the search
    await page.route(
      "http://oar.test/api/oar/collections/swissgeo-catalog/items/dat_pixelkarte-farbe*",
      (route) =>
        route.fulfill({ status: 200, json: ChSwisstopoPixelkarteFarbeDataset }),
    );
    await page.route(
      "http://oar.test/api/oar/collections/swissgeo-distributions/items/ch.swisstopo.pixelkarte-farbe*",
      (route) =>
        route.fulfill({
          status: 200,
          json: ChSwisstopoPixelkarteFarbeDistribution,
        }),
    );
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("switches the tabs by touch and closes without a horizontal scroll", async ({
    page,
  }) => {
    // A direct load renders the dataset on the server, where the route mocks
    // do not apply. The search opens it in the browser. Its info button only
    // shows on wide screens, so the phone size comes after the navigation.
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await page.getByTestId("topbar-search-input").fill("pixelkarte");
    await page.getByTestId("search-result-info-0").click();
    await expect(page).toHaveURL(/\/de\/dataset\//);
    await page.setViewportSize({ width: 390, height: 844 });

    const panel = page.getByTestId("dataset-panel");
    await expect(panel.getByTestId("dataset-title")).toBeVisible();

    const hasHorizontalScroll = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
    expect(await hasHorizontalScroll()).toBe(false);

    for (const [name, tab] of [
      ["Legende", "legend"],
      ["Datenbezug", "data-access"],
      ["Metadaten", "metadata"],
    ]) {
      await panel.getByRole("tab", { name }).tap();
      await expect(panel.getByRole("tab", { name })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page).toHaveURL(new RegExp(`tab=${tab}`));
      expect(await hasHorizontalScroll()).toBe(false);
    }
    // The default tab keeps the URL short
    await panel.getByRole("tab", { name: "Überblick" }).tap();
    await expect(page).not.toHaveURL(/tab=/);

    // the "map not available" toast would cover the close button
    await page
      .getByRole("region", { name: "Benachrichtigungen (F8)" })
      .locator('[data-slot="close"]')
      .tap();
    await panel
      .getByRole("button", { name: "Datensatzdetails schliessen" })
      .tap();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(/\/de\/map/);
  });
});
