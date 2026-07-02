import { expect, test } from "@playwright/test";

import {
  HYDRATION_TIMEOUT,
  mockExternalRequests,
  cleanupExternalRequestMocks,
} from "./setup";

const BASE_STATE = {
  version: "1.0",
  state: {
    map: {
      center: [2660000, 1190000],
      zoom: 1,
      rotation: 0,
    },
    layers: [
      {
        layerUrl:
          "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/my-fancy-layer",
        type: "dataset",
        isVisible: true,
        opacity: 1,
        dimensions: {
          time: {
            currentValue: "current",
          },
        },
      },
    ],
  },
};

const toBase64 = (obj: object): string => btoa(JSON.stringify(obj));

test.describe("Layer Loading", () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalRequests(page).mockAll();
  });

  test.afterEach(async ({ page }) => {
    await cleanupExternalRequestMocks(page);
  });

  test("Shows and error if the distribution link can't be loaded", async ({
    page,
  }) => {
    await page.route(
      "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/my-fancy-layer",
      (route) => {
        return route.fulfill({
          status: 200,
          json: {
            id: "my-fancy-layer",
            links: [
              {
                href: "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/my-fancy-layer",
                rel: "self",
                title: "This Record",
                type: "application/json",
              },
              {
                // this one points to a 404
                href: "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/inexisting",
                rel: "distributions",
              },
            ],
            properties: {
              title: "My Fancy Layer",
              type: "Dataset",
            },
          },
        });
      },
    );

    await page.route(
      "http://mock-oar.org/api/oar/collections/swissgeo.catalog/items/inexisting",
      (route) => {
        return route.fulfill({ status: 404 });
      },
    );

    const stateStr = toBase64(BASE_STATE);

    await page.goto(`/en/map?statestr=${stateStr}`);
    await expect(page.getByTestId("ol-map")).toBeVisible({
      timeout: HYDRATION_TIMEOUT,
    });

    await expect(
      page.getByText("Failed to add layer my-fancy-layer to map", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
