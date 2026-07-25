import { describe, expect, it } from "vitest";

import { buildCatalogItemsUrl } from "../catalogUrl";

describe("buildCatalogItemsUrl", () => {
  it("builds the items URL for a collection", () => {
    expect(
      buildCatalogItemsUrl("https://x/api/oar/rc1", "swissgeo-catalog"),
    ).toBe("https://x/api/oar/rc1/collections/swissgeo-catalog/items");
  });

  it("targets a single record when an id is given", () => {
    expect(
      buildCatalogItemsUrl("https://x/api/oar/rc1", "swissgeo-catalog", "ch.foo.bar"),
    ).toBe(
      "https://x/api/oar/rc1/collections/swissgeo-catalog/items/ch.foo.bar",
    );
  });

  it("normalizes surrounding slashes on segments", () => {
    expect(
      buildCatalogItemsUrl("https://x/api/oar/rc1/", "/swissgeo-catalog/", "/id/"),
    ).toBe("https://x/api/oar/rc1/collections/swissgeo-catalog/items/id");
  });
});
