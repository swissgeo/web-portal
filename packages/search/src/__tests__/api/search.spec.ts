import type { Mock } from "vitest";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type {
  FeatureSearchResult,
  LocationSearchResult,
  SearchResponseResult,
} from "@/types/search";

import {
  escapeHtml,
  sanitizeTitle,
  searchLocation,
  searchLayers,
  searchLayerFeatures,
  parseLocationResult,
} from "../../api/search"; // for some reason, the @/api/search doesn't find anything

describe("escapeHtml function", () => {
  it.each`
    description                                                                  | inputString                                                                                         | expectedResult
    ${"Escape the ' character correctly"}                                        | ${"'"}                                                                                              | ${"&#039;"}
    ${'Escape the " character correctly'}                                        | ${'"'}                                                                                              | ${"&quot;"}
    ${"Escape the < character correctly"}                                        | ${"<"}                                                                                              | ${"&lt;"}
    ${"Escape the > character correctly"}                                        | ${">"}                                                                                              | ${"&gt;"}
    ${"Escape the & character correctly"}                                        | ${"&"}                                                                                              | ${"&amp;"}
    ${"escapes a string containing multiple special characters correctly"}       | ${"Hello, this 'test' is here to \"test\" that some <characters> are correctly escaped & handled."} | ${"Hello, this &#039;test&#039; is here to &quot;test&quot; that some &lt;characters&gt; are correctly escaped &amp; handled."}
    ${"returns the initial string if there are no special characters to escape"} | ${"Hello sir, this is a test in progress!!!"}                                                       | ${"Hello sir, this is a test in progress!!!"}
  `("$description", ({ _, inputString, expectedResult }) => {
    expect(escapeHtml(inputString)).to.eql(expectedResult);
  });
});

describe("sanitizeTitle function", () => {
  it.each`
    description                                                                  | inputString                                                                                        | expectedResult
    ${"escapes a string containing special characters correctly"}                | ${'<i>Did you know</i>, <b>testing</b> <a href="some_bad_actor_stuff">something is important</a>'} | ${"Did you know, testing something is important"}
    ${"returns the initial string if there are no special characters to escape"} | ${"Did you know, testing something is important"}                                                  | ${"Did you know, testing something is important"}
    ${"returns an empty string by default"}                                      | ${undefined}                                                                                       | ${""}
  `("$description", ({ _, inputString, expectedResult }) => {
    expect(sanitizeTitle(inputString)).to.eql(expectedResult);
  });
});

describe("parseLocationResult function", () => {
  const baseSearchResult: SearchResponseResult = {
    id: 0,
    weight: 0,
    attrs: { label: "A fantastic <b>Label</b>" },
  };

  type LocationResultType = "LOCATION";
  const resultType: LocationResultType = "LOCATION";

  const baseExpectedResult: LocationSearchResult = {
    resultType,
    id: "A fantastic <b>Label</b>",
    featureId: "A fantastic <b>Label</b>",
    title: "A fantastic <b>Label</b>",
    sanitizedTitle: "A fantastic Label",
    description: "",
    coordinate: undefined,
    zoom: 6,
  };
  beforeEach(() => {
    baseSearchResult.attrs = { label: "A fantastic <b>Label</b>" };
  });
  it("sets the default correctly when there is only a label", () => {
    const expectedResult: LocationSearchResult = { ...baseExpectedResult };
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });
  it("does not set coordinates if there is only one coordinate", () => {
    baseSearchResult.attrs.x = 12;
    const expectedResult = { ...baseExpectedResult };
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });
  it("sets and inverts the coordinates correctly if both x and y are present", () => {
    baseSearchResult.attrs.x = 12;
    baseSearchResult.attrs.y = 8;
    const expectedResult: LocationSearchResult = { ...baseExpectedResult };
    expectedResult.coordinate = [8, 12];
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });
  it("sets the description if the detail attribute is set", () => {
    baseSearchResult.attrs.detail = "a wonderful description";
    const expectedResult: LocationSearchResult = { ...baseExpectedResult };
    expectedResult.description = "a wonderful description";
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });
  it("changes the id and featureId if the featureId attribute is set", () => {
    baseSearchResult.attrs.featureId = "test id 1";
    const expectedResult: LocationSearchResult = { ...baseExpectedResult };
    expectedResult.featureId = "test id 1";
    expectedResult.id = "test id 1";
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });

  it("The zoom remain at 6 if we receive a value that makes no sense from the API", () => {
    const expectedResult: LocationSearchResult = { ...baseExpectedResult };
    //@ts-expect-error we are willingly simulating an API issue here
    baseSearchResult.attrs.zoomlevel = "Jean Pierre";
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
    baseSearchResult.attrs.zoomlevel = null;
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
    baseSearchResult.attrs.zoomlevel = -6;
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
    baseSearchResult.attrs.zoomlevel = 83;
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });
  it("Sets the zoom correctly when the zoom is set to a valid value", () => {
    baseSearchResult.attrs.zoomlevel = 12;
    const expectedResult: LocationSearchResult = { ...baseExpectedResult };
    expectedResult.zoom = 12;
    expect(parseLocationResult(baseSearchResult)).toMatchObject(expectedResult);
  });
  it("Throws an exception when there is no attributes", () => {
    baseSearchResult.attrs = null;
    try {
      parseLocationResult(baseSearchResult);
      expect(false).to.eql(true);
    } catch (error) {
      expect((error as Error).message).to.eql(
        "Invalid location result, cannot be parsed",
      );
    }
  });
});

describe("searchLocation function", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for short query", async () => {
    const result = await searchLocation("a", "de");
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("parses valid location result and swaps coordinates", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => ({
        results: [
          {
            attrs: {
              label: "Bern",
              detail: "City of Bern",
              featureId: "123",
              x: 1200000,
              y: 2600000,
              zoomlevel: 8,
            },
          },
        ],
      }),
    });

    const result = await searchLocation("Bern", "de");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      resultType: "LOCATION",
      id: "123",
      coordinate: [2600000, 1200000], // swapped
      zoom: 8,
    });
  });

  it("defaults zoom when invalid", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => ({
        results: [
          {
            attrs: {
              label: "Test",
              x: 1,
              y: 2,
              zoomlevel: 4294967295,
            },
          },
        ],
      }),
    });

    const result = await searchLocation("Test", "de");

    expect(result[0]?.zoom).toBe(6);
  });

  it("rethrows AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetch as Mock).mockRejectedValue(abortError);

    await expect(searchLocation("Bern", "de")).rejects.toThrow("Aborted");
  });

  it("returns empty array on API error response", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await searchLocation("Bern", "de");
    expect(result).toEqual([]);
  });
});

describe("searchLayers function", () => {
  const catalogUrl =
    "http://mock-oar.test/api/oar/collections/swissgeo-catalog/items";

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("queries the catalog items endpoint with q, language and format", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => ({ features: [] as { id: string }[] }),
    });

    await searchLayers("voyageurs", catalogUrl, "fr", undefined, 5);

    const calledWith = (fetch as Mock).mock.calls[0][0] as string;
    const url = new URL(calledWith);
    expect(url.origin + url.pathname).toBe(catalogUrl);
    expect(url.searchParams.get("f")).toBe("json");
    expect(url.searchParams.get("q")).toBe("voyageurs");
    expect(url.searchParams.get("language")).toBe("fr");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("maps returned features to layer search results", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => ({
        features: [
          {
            id: "layer-1",
            properties: {
              title: "<b>Test Layer</b>",
              description: "Layer description",
            },
          },
        ],
      }),
    });

    const result = await searchLayers("test", catalogUrl, "de");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      resultType: "LAYER",
      id: "layer-1",
      layerId: "layer-1",
      sanitizedTitle: "Test Layer",
      description: "Layer description",
    });
  });

  it("falls back to the id when a feature has no title", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => ({ features: [{ id: "layer-42" }] }),
    });

    const result = await searchLayers("layer", catalogUrl, "de");

    expect(result[0]).toMatchObject({
      id: "layer-42",
      title: "layer-42",
      sanitizedTitle: "layer-42",
      description: "",
    });
  });

  it("rethrows AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetch as Mock).mockRejectedValue(abortError);

    await expect(searchLayers("test", catalogUrl, "de")).rejects.toThrow(
      "Aborted",
    );
  });

  it("rejects on API error response", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(searchLayers("test", catalogUrl, "de")).rejects.toThrow(
      "Layer search API error: 500",
    );
  });
});

describe("searchLayerFeatures", () => {
  const searchResult: SearchResponseResult[] = [];
  const featureFounds: FeatureSearchResult[] = [];

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    searchResult[0] = {
      id: 0,
      weight: 0,
      attrs: {
        label: "Test Title",
      },
    };
    featureFounds[0] = {
      resultType: "FEATURE",
      id: "Test Title",
      featureId: "Test Title",
      layerId: "layerId",
      layerName: "Layer Name",
      title: "<strong>Layer Name</strong><br/>Test Title",
      sanitizedTitle: "Layer Name - Test Title",
      description: "",
      coordinate: undefined,
      zoom: 10,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("handles short queries and return an empty result", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "a",
      "de",
      "layerId",
      "Layer Name",
    );

    expect(result).toHaveLength(0);
  });
  it("handles feature with no attributes", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: [{ id: 0, weight: 0 }],
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );

    expect(result).toHaveLength(0);
  });
  it("handles feature returning only the minimal attributes", async () => {
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(featureFounds[0] ?? {});
  });
  it("handles featureId attribute", async () => {
    searchResult[0].attrs.featureId = "feature Id";
    featureFounds[0].id = "feature Id";
    featureFounds[0].featureId = "feature Id";
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(featureFounds[0] ?? {});
  });
  it("handles detail attribute", async () => {
    searchResult[0].attrs.detail = "This is meant to be a description";
    featureFounds[0].description = "This is meant to be a description";
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(featureFounds[0] ?? {});
  });
  it("handles bounding box attribute", async () => {
    searchResult[0].attrs.geom_st_box2d =
      "BOX(2600000 1200000,2600010 1200010)";
    featureFounds[0].coordinate = [2600000, 1200000];
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(featureFounds[0] ?? {});
  });
  it("handles zoom level attribute", async () => {
    searchResult[0].attrs.zoomlevel = 18;
    featureFounds[0].zoom = 18;
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(featureFounds[0] ?? {});
  });
  it("handles all attributes together correctly", async () => {
    searchResult[0] = {
      id: 0,
      weight: 0,
      attrs: {
        featureId: "feature Id",
        zoomlevel: 4,
        detail: "short description",
        label: "what a Title",
        geom_st_box2d: "BOX(2603000 1200000,2600010 1100710)",
      },
    };
    featureFounds[0] = {
      resultType: "FEATURE",
      coordinate: [2603000, 1200000],
      title: "<strong>Layer Name</strong><br/>what a Title",
      zoom: 4,
      sanitizedTitle: "Layer Name - what a Title",
      layerId: "layerId",
      layerName: "Layer Name",
      featureId: "feature Id",
      id: "feature Id",
      description: "short description",
    };
    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => {
        return {
          results: searchResult,
        };
      },
    });
    const result = await searchLayerFeatures(
      "Feature",
      "de",
      "layerId",
      "Layer Name",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(featureFounds[0] ?? {});
  });

  it("rethrows AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (fetch as Mock).mockRejectedValue(abortError);

    await expect(
      searchLayerFeatures("Feature", "de", "layer", "LayerName"),
    ).rejects.toThrow("Aborted");
  });
});
