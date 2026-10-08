import type { Mock } from "vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DatasetCollection } from "@/types/Records";

import { fetchCatalogItems } from "../catalogItems";

const ITEMS_URL = "https://api.example.com/collections/swissgeo-catalog/items";

const page: DatasetCollection = {
  type: "FeatureCollection",
  features: [
    { id: "a", properties: { type: "Dataset", title: "A" }, links: [] },
  ],
  links: [],
  numberMatched: 1,
  numberReturned: 1,
};

/** The URL of the last request, split into its endpoint and its parameters */
function lastRequest() {
  const url = new URL((fetch as Mock).mock.lastCall![0] as string);
  return {
    endpoint: url.origin + url.pathname,
    params: Object.fromEntries(url.searchParams),
  };
}

describe("fetchCatalogItems", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => page,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the first page ordered by title when there is no query", async () => {
    const result = await fetchCatalogItems(ITEMS_URL, {
      lang: "fr",
      limit: 100,
    });

    expect(fetch).toHaveBeenCalledOnce();
    expect(lastRequest()).toEqual({
      endpoint: ITEMS_URL,
      params: { lang: "fr", limit: "100", offset: "0", sortby: "title" },
    });
    expect(result).toEqual(page);
  });

  it("searches by relevance when there is a query", async () => {
    await fetchCatalogItems(ITEMS_URL, { lang: "de", limit: 10, q: "forest" });

    expect(lastRequest().params).toEqual({
      lang: "de",
      limit: "10",
      offset: "0",
      q: "forest",
    });
  });

  it("ignores the whitespace around the query", async () => {
    await fetchCatalogItems(ITEMS_URL, {
      lang: "de",
      limit: 10,
      q: "  tree of heaven  ",
    });

    expect(lastRequest().params.q).toBe("tree of heaven");
  });

  it("ignores a query made of whitespace only", async () => {
    await fetchCatalogItems(ITEMS_URL, { lang: "de", limit: 10, q: "   " });

    expect(lastRequest().params).toEqual({
      lang: "de",
      limit: "10",
      offset: "0",
      sortby: "title",
    });
  });

  it("skips the records before the given offset", async () => {
    await fetchCatalogItems(ITEMS_URL, { lang: "de", limit: 100, offset: 200 });

    expect(lastRequest().params.offset).toBe("200");
  });

  it("passes the abort signal on to the request", async () => {
    const { signal } = new AbortController();

    await fetchCatalogItems(ITEMS_URL, { lang: "de", limit: 10, signal });

    expect((fetch as Mock).mock.lastCall![1]).toEqual({ signal });
  });

  it("rethrows AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetch as Mock).mockRejectedValue(abortError);

    await expect(
      fetchCatalogItems(ITEMS_URL, { lang: "de", limit: 10 }),
    ).rejects.toBe(abortError);
  });

  it("rejects on API error response", async () => {
    (fetch as Mock).mockResolvedValue({ ok: false, status: 500 });

    await expect(
      fetchCatalogItems(ITEMS_URL, { lang: "de", limit: 10 }),
    ).rejects.toThrow("Catalog items API error: 500");
  });
});
