import type { LayerSearchResult, SearchResult } from "@swissgeo/search";

import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchMocks = vi.hoisted(() => ({
  searchCoordinate: vi.fn(),
  searchLocation: vi.fn(),
  searchLayers: vi.fn(),
  searchLayerFeatures: vi.fn(),
}));

vi.mock("@swissgeo/search", () => searchMocks);
vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({ layers: [] as unknown[] }),
}));
vi.mock("@swissgeo/log", () => ({
  default: { error: vi.fn() },
  LogPreDefinedColor: { Red: "red" },
}));

vi.stubGlobal("useRuntimeConfig", () => ({
  public: {
    ogcApiEndpoint: "http://catalog.test/api",
    ogcCatalogCollection: "swissgeo-catalog",
  },
}));

const { useSearchStore } = await import("../../stores/search");

const layer = (id: string): LayerSearchResult => ({
  resultType: "LAYER",
  id,
  layerId: id,
  title: id,
  sanitizedTitle: id,
  description: "",
});

describe("useSearchStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    searchMocks.searchCoordinate.mockReturnValue(undefined);
    searchMocks.searchLocation.mockResolvedValue([]);
    searchMocks.searchLayers.mockResolvedValue([]);
    searchMocks.searchLayerFeatures.mockResolvedValue([]);
  });

  it("clears results without searching for a query shorter than 2 chars", async () => {
    const store = useSearchStore();
    await store.setSearchQuery("a");

    expect(store.results).toEqual([]);
    expect(searchMocks.searchLayers).not.toHaveBeenCalled();
  });

  it("collects results from all sources without error on success", async () => {
    searchMocks.searchLayers.mockResolvedValue([layer("l1"), layer("l2")]);

    const store = useSearchStore();
    await store.setSearchQuery("forest");

    expect(store.layerResults).toHaveLength(2);
    expect(store.hasError).toBe(false);
  });

  it("sets hasError when a source fails but keeps the other results", async () => {
    searchMocks.searchLocation.mockResolvedValue([
      { resultType: "LOCATION", id: "bern" } as SearchResult,
    ]);
    searchMocks.searchLayers.mockRejectedValue(new Error("catalog down"));

    const store = useSearchStore();
    await store.setSearchQuery("bern");

    expect(store.hasError).toBe(true);
    expect(store.locationResults).toHaveLength(1);
  });

  it("does not set hasError when a request is aborted", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    searchMocks.searchLayers.mockRejectedValue(abortError);

    const store = useSearchStore();
    await store.setSearchQuery("bern");

    expect(store.hasError).toBe(false);
  });

  it("keeps the coordinate result alongside the results of the other sources", async () => {
    const coordinate = {
      resultType: "COORDINATE",
      id: "coordinate-2600000,1200000",
    } as SearchResult;
    searchMocks.searchCoordinate.mockReturnValue(coordinate);
    searchMocks.searchLayers.mockResolvedValue([layer("l1")]);

    const store = useSearchStore();
    await store.setSearchQuery("2600000 1200000");

    expect(store.coordinateResults).toEqual([coordinate]);
    expect(store.layerResults).toHaveLength(1);
  });

  it("keeps the coordinate result when every other source fails", async () => {
    const coordinate = { resultType: "COORDINATE", id: "c" } as SearchResult;
    searchMocks.searchCoordinate.mockReturnValue(coordinate);
    searchMocks.searchLayers.mockRejectedValue(new Error("catalog down"));

    const store = useSearchStore();
    await store.setSearchQuery("2600000 1200000");

    expect(store.coordinateResults).toEqual([coordinate]);
  });

  it("keeps the pinned coordinate until it is explicitly cleared", () => {
    const store = useSearchStore();
    store.setPinnedCoordinate([2600000, 1200000]);
    store.clearSearch();
    expect(store.pinnedCoordinate).toEqual([2600000, 1200000]);

    store.clearPinnedCoordinate();
    expect(store.pinnedCoordinate).toBeUndefined();
  });

  it("resets hasError on clearSearch", async () => {
    searchMocks.searchLayers.mockRejectedValue(new Error("catalog down"));

    const store = useSearchStore();
    await store.setSearchQuery("bern");
    expect(store.hasError).toBe(true);

    store.clearSearch();
    expect(store.hasError).toBe(false);
  });
});
