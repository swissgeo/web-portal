import type { Page } from "@playwright/test";

import { expect, test } from "@playwright/test";

import {
  cleanupExternalRequestMocks,
  dismissToasts,
  HYDRATION_TIMEOUT,
  mockCatalogList,
  mockExternalRequests,
  mockMapBackground,
} from "../setup";

/** Two folders with entries, so the tree has levels to open */
async function mockThesaurusConcepts(page: Page) {
  await page.route("http://thesaurus.test/**", (route) =>
    route.fulfill({
      status: 200,
      json: {
        thesaurus_id: "ech0166",
        concepts: [
          {
            concept_id: "planning",
            label: "Grundlagen und Planung",
            children: [{ concept_id: "zoning", label: "Raumplanung" }],
          },
          {
            concept_id: "nature",
            label: "Natur und Umwelt",
            children: [
              { concept_id: "geology", label: "Geologie" },
              { concept_id: "soil", label: "Boden" },
            ],
          },
        ],
      },
    }),
  );
}

test.describe("mobile data catalog", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
    await mockMapBackground(page);
    await mockCatalogList(page);
    await mockThesaurusConcepts(page);
    await page.goto("/de/map");
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });
    await dismissToasts(page);
    await page.getByTestId("footer-nav-catalog").tap();
    await expect(page.getByTestId("catalog-table")).toBeVisible({
      timeout: 15_000,
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("opens a folder in the tree and filters the layers", async ({
    page,
  }) => {
    await page.getByTestId("catalog-tree-open").tap();
    await expect(page.getByTestId("catalog-tree-close")).toBeVisible();
    await expect(page.getByTestId("catalog-table")).toBeHidden();

    const children = page.getByTestId("catalog-tree-child");
    await children.filter({ hasText: "Natur und Umwelt" }).tap();
    await expect(page.getByTestId("catalog-tree-folder")).toHaveText(
      "Natur und Umwelt",
    );

    await page.getByTestId("catalog-tree-back").tap();
    await expect(page.getByTestId("catalog-tree-back")).toBeHidden();

    await children.filter({ hasText: "Natur und Umwelt" }).tap();
    const filteredList = page.waitForRequest(/[?&]concepts=geology(&|$)/);
    await children.filter({ hasText: "Geologie" }).tap();

    await filteredList;
    await expect(page.getByTestId("catalog-tree-close")).toBeHidden();
    await expect(page.getByTestId("catalog-tree-open")).toHaveText("Geologie");
  });

  test("selects a whole folder", async ({ page }) => {
    await page.getByTestId("catalog-tree-open").tap();
    // Opening a folder already filters the layers by the folder and its entries
    const filteredList = page.waitForRequest(
      /[?&]concepts=geology%7Cnature%7Csoil(&|$)/,
    );
    await page
      .getByTestId("catalog-tree-child")
      .filter({ hasText: "Natur und Umwelt" })
      .tap();
    await filteredList;

    await page.getByTestId("catalog-tree-folder").tap();

    await expect(page.getByTestId("catalog-tree-close")).toBeHidden();
    await expect(page.getByTestId("catalog-tree-open")).toHaveText(
      "Natur und Umwelt",
    );
  });

  test("closes the tree with its close button", async ({ page }) => {
    await page.getByTestId("catalog-tree-open").tap();
    await page.getByTestId("catalog-tree-close").tap();

    await expect(page.getByTestId("catalog-tree-close")).toBeHidden();
    await expect(page.getByTestId("catalog-table")).toBeVisible();
  });

  test("searches the layers", async ({ page }) => {
    const searchRequest = page.waitForRequest(/[?&]q=pixelkarte/);

    await page.getByTestId("catalog-search-input").fill("pixelkarte");

    await searchRequest;
    await expect(page.getByTestId("catalog-layer-row")).toHaveCount(1);
  });

  test("puts a layer on the map and takes it off again", async ({ page }) => {
    const layerSwitch = page.getByTestId("catalog-layer-on-map").first();
    await expect(layerSwitch).toHaveAttribute("aria-checked", "false");

    await layerSwitch.tap();
    await expect(layerSwitch).toHaveAttribute("aria-checked", "true", {
      timeout: 15_000,
    });

    await layerSwitch.tap();
    await expect(layerSwitch).toHaveAttribute("aria-checked", "false");
  });
});
