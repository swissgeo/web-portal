import type { LayerSearchResult, SearchResult } from "@swissgeo/search";

import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const searchMocks = vi.hoisted(() => ({
  searchCoordinate: vi.fn(),
  searchLocation: vi.fn(),
  searchLayers: vi.fn(),
  searchLayerFeatures: vi.fn(),
  searchContentPages: vi.fn(),
}));

vi.mock("@swissgeo/search", () => searchMocks);
vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({ layers: [] as unknown[] }),
}));
vi.mock("@swissgeo/log", () => ({
  default: { error: vi.fn() },
  LogPreDefinedColor: { Red: "red" },
}));

const runtimeConfig = vi.hoisted(() => ({
  public: {
    ogcApiEndpoint: "http://catalog.test/api",
    ogcCatalogCollection: "swissgeo-catalog",
    featureFlags: {
      enableCmsSearch: true,
    },
  },
}));

vi.stubGlobal("useRuntimeConfig", () => runtimeConfig);

const { useSearchStore } = await import("../../stores/search");

const layer = (id: string): LayerSearchResult => ({
  resultType: "LAYER",
  id,
  layerId: id,
  title: id,
  sanitizedTitle: id,
  description: "",
});

const location = (id: string, title: string): SearchResult => ({
  resultType: "LOCATION",
  id,
  title,
  sanitizedTitle: title,
  description: "",
});

describe("useSearchStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    runtimeConfig.public.featureFlags.enableCmsSearch = true;
    searchMocks.searchCoordinate.mockReturnValue(undefined);
    searchMocks.searchLocation.mockResolvedValue([]);
    searchMocks.searchLayers.mockResolvedValue([]);
    searchMocks.searchLayerFeatures.mockResolvedValue([]);
    searchMocks.searchContentPages.mockResolvedValue([]);
    vi.clearAllMocks();
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

  // the SearchServer answers "Ber" with the canton twice, as Bern (BE) and
  // Berne (BE), both with featureId 351: only one of them may stay, or the
  // results list holds the same id twice
  it("keeps only the first of two results sharing an id", async () => {
    searchMocks.searchLocation.mockResolvedValue([
      location("351", "Bern (BE)"),
      location("351", "Berne (BE)"),
    ]);

    const store = useSearchStore();
    await store.setSearchQuery("ber");

    expect(store.locationResults).toHaveLength(1);
    expect(store.results[0]?.title).toBe("Bern (BE)");
  });

  it("drops an entry the backend returns twice", async () => {
    const exit = location("bern-wankdorf", "Bern-Wankdorf (BE) - Bern");
    searchMocks.searchLocation.mockResolvedValue([exit, { ...exit }]);

    const store = useSearchStore();
    await store.setSearchQuery("bern");

    expect(store.results).toHaveLength(1);
  });

  it("keeps results of different types sharing an id", async () => {
    searchMocks.searchLocation.mockResolvedValue([
      location("351", "Bern (BE)"),
    ]);
    searchMocks.searchLayers.mockResolvedValue([layer("351")]);

    const store = useSearchStore();
    await store.setSearchQuery("bern");

    expect(store.locationResults).toHaveLength(1);
    expect(store.layerResults).toHaveLength(1);
  });

  it("lists each id only once for a payload as the API sends it for Bern", async () => {
    // ids as parseLocationResult builds them: the featureId where the backend
    // sends one, the label where it does not
    const byLabel = (label: string) => location(label, label);
    searchMocks.searchLocation.mockResolvedValue([
      location("351", "Bern (BE)"),
      location("246", "Bern-Mittelland"),
      byLabel("<b>Bern</b> (BE) - Bremgarten,Bern"),
      byLabel("<b>Bern\n</b> (BE) - Bremgarten,Bern"),
      byLabel("<i>Exit</i> <b>Bern-Wankdorf</b> (BE) - Bern"),
      byLabel("<i>Exit</i> <b>Bern-Wankdorf</b> (BE) - Bern"),
    ]);

    const store = useSearchStore();
    await store.setSearchQuery("bern");

    const ids = store.results.map((result) => result.id);
    expect(new Set(ids).size).toBe(ids.length);
    // the labels differing only by a newline have distinct ids, so both stay;
    // the doubled exit does not
    expect(store.results).toHaveLength(5);
  });

  it("keeps the CMS results apart from the map ones", async () => {
    searchMocks.searchLayers.mockResolvedValue([layer("l1")]);
    searchMocks.searchContentPages.mockResolvedValue([
      { resultType: "CONTENT", id: "content-42" } as SearchResult,
    ]);

    const store = useSearchStore();
    await store.setSearchQuery("forest");

    expect(store.layerResults).toHaveLength(1);
    expect(store.contentResults).toHaveLength(1);
    expect(searchMocks.searchContentPages).toHaveBeenCalled();
  });

  it("skips the CMS search when the feature flag is off", async () => {
    runtimeConfig.public.featureFlags.enableCmsSearch = false;
    const store = useSearchStore();

    await store.setSearchQuery("forest");

    expect(store.enableCmsSearch).toBe(false);
    expect(searchMocks.searchContentPages).not.toHaveBeenCalled();
    expect(store.contentResults).toEqual([]);
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

  it("keeps the coordinate out of the listed results", async () => {
    const coordinate = {
      resultType: "COORDINATE",
      id: "coordinate-2600000,1200000",
    } as SearchResult;
    searchMocks.searchCoordinate.mockReturnValue(coordinate);
    searchMocks.searchLayers.mockResolvedValue([layer("l1")]);

    const store = useSearchStore();
    await store.setSearchQuery("2600000 1200000");

    expect(store.coordinateResult).toEqual(coordinate);
    expect(store.results).toEqual([layer("l1")]);
  });

  it("forgets the coordinate as soon as the query is not one anymore", async () => {
    searchMocks.searchCoordinate.mockReturnValue({
      resultType: "COORDINATE",
      id: "c",
    } as SearchResult);

    const store = useSearchStore();
    await store.setSearchQuery("2600000 1200000");
    expect(store.coordinateResult).toBeDefined();

    searchMocks.searchCoordinate.mockReturnValue(undefined);
    await store.setSearchQuery("Bern");
    expect(store.coordinateResult).toBeUndefined();
  });

  it("keeps the pinned coordinate when a result is selected", () => {
    const store = useSearchStore();
    store.setPinnedCoordinate([2600000, 1200000]);
    store.clearSearch();
    expect(store.pinnedCoordinate).toEqual([2600000, 1200000]);

    store.clearPinnedCoordinate();
    expect(store.pinnedCoordinate).toBeUndefined();
  });

  it("drops the pinned coordinate when the field is emptied", async () => {
    const store = useSearchStore();
    store.setPinnedCoordinate([2600000, 1200000]);

    await store.setSearchQuery("");

    expect(store.pinnedCoordinate).toBeUndefined();
  });

  // the map still shows the place whose name is being retyped
  it("keeps the pinned coordinate when the query is only shortened", async () => {
    const store = useSearchStore();
    store.setPinnedCoordinate([2600000, 1200000]);

    await store.setSearchQuery("B");

    expect(store.pinnedCoordinate).toEqual([2600000, 1200000]);
  });

  it("cancels a request still on its way when a result is selected", () => {
    let signal: AbortSignal | undefined;
    searchMocks.searchLayers.mockImplementation(
      (_query: string, _url: string, _lang: string, abortSignal: AbortSignal) =>
        new Promise(() => {
          signal = abortSignal;
        }),
    );

    const store = useSearchStore();
    void store.setSearchQuery("bern");
    expect(store.isSearching).toBe(true);

    store.keepSelectedQuery("Bern");

    expect(signal?.aborted).toBe(true);
    expect(store.isSearching).toBe(false);
  });

  it("keeps the selected name in the query but drops the results", async () => {
    searchMocks.searchLayers.mockResolvedValue([layer("l1")]);

    const store = useSearchStore();
    await store.setSearchQuery("bern");
    expect(store.results).not.toEqual([]);

    store.keepSelectedQuery("Bern");

    expect(store.query).toBe("Bern");
    expect(store.results).toEqual([]);
    expect(store.coordinateResult).toBeUndefined();
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
