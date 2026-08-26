import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it, vi } from "vitest";

import type { Catalog, CatalogItem } from "~/types/layerCatalog";

const getQueryMock = vi.fn();

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("getQuery", getQueryMock);
// Stands in for Nitro's server assets by reading the very files it would ship,
// so the catalogs under test are the ones that actually get served.
vi.stubGlobal("useStorage", () => ({
  getItem: (key: string) =>
    readFile(
      fileURLToPath(new URL(`../../../../../assets/${key}`, import.meta.url)),
      "utf8",
    ).catch(() => null),
}));

const handlerPromise = import("../catalog").then(
  ({ default: handler }) => handler,
);

afterAll(() => {
  vi.unstubAllGlobals();
});

/** Fetches a catalog the way the route is called, through its `lang` query. */
async function fetchCatalog(lang: unknown): Promise<Catalog> {
  getQueryMock.mockReturnValue({ lang });
  const handler = await handlerPromise;
  return (await handler({} as never)) as Catalog;
}

/**
 * The tree stripped of every translated string, so that two locales can be
 * compared for structure alone.
 */
function shapeOf(items: CatalogItem[]): unknown {
  return items.map((item) =>
    item.type === "group"
      ? { type: "group", children: shapeOf(item.children) }
      : { type: "layer", layerId: item.layerId },
  );
}

describe("the layer catalog endpoint", () => {
  it.each(["de", "en"])("serves the %s catalog, validated", async (lang) => {
    const catalog = await fetchCatalog(lang);

    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.every((group) => group.type === "group")).toBe(true);
  });

  it("keeps every locale structurally identical, differing only in labels", async () => {
    const [german, english] = await Promise.all([
      fetchCatalog("de"),
      fetchCatalog("en"),
    ]);

    expect(shapeOf(german!)).toEqual(shapeOf(english!));
    expect(german).not.toEqual(english);
  });

  it.each([["fr"], [undefined], [["en", "de"]]])(
    "falls back to English for %s",
    async (lang) => {
      expect(await fetchCatalog(lang)).toEqual(await fetchCatalog("en"));
    },
  );
});
