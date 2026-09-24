import { setActivePinia, createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@swissgeo/log", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import type { FlatExtent } from "@swissgeo/shared";
import type { Feature as geojsonFeature } from "geojson";

import log from "@swissgeo/log";

import type {
  FeatureData,
  LayerRequest,
  LayerSource,
  WMSLayerRequest,
} from "@/types";

import { FEATURE_LIMIT } from "@/constants";
import {
  createIdentifyResponse,
  getFeaturesForOneLayer,
  selectFeatures,
} from "@/selectFeatures";
import { useFeaturesStore } from "@/stores/feature";

import distributionCollectionJson from "./fixtures/distributionCollection_ch.astra.json";
import htmlPopup from "./fixtures/htmlPopup_ch.astra";
import identifyResponse from "./fixtures/identifyResponse_ch.astra.json";
import identifyResponseEmpty from "./fixtures/identifyResponse_empty.json";
import vectorFeaturesJson from "./fixtures/vectorFeatures.json";

const vectorFeatures = vectorFeaturesJson as unknown as {
  features: geojsonFeature[];
};

const geoadminFeaturesDistribution = distributionCollectionJson.features.find(
  (feature) => feature.properties.protocol === "geoadmin:features",
)!;
const previewLinkTemplate = geoadminFeaturesDistribution.linkTemplates.find(
  (linkTemplate) => linkTemplate.rel === "preview",
)!;
const URL_TEMPLATE = previewLinkTemplate.uriTemplate!;
const LAYER_ID = distributionCollectionJson.id;

const BASE_URL = URL_TEMPLATE.replace(
  `/${LAYER_ID}/{featureId}/htmlPopup?lang={lang}`,
  "",
);
const geoadminInfo = {
  protocol: "geoadmin:features" as const,
  baseUrl: BASE_URL,
};

const EXTENT: FlatExtent = [2599000, 1199000, 2601000, 1201000];
const EPSG = 2056;
const LANG = "de";

function mockResponse(body: unknown, status = 200): Response {
  return {
    status,
    json: () => Promise.resolve(body),
    text: () =>
      Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

function featureData(id: string): FeatureData {
  return {
    featureId: id,
    geometry: { type: "Point", coordinates: [0, 0] },
    content: { kind: "json", properties: {} },
  };
}

const fetchSpy = vi.fn();

describe("Feature Selection from layers and extent", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
  });

  describe("getFeaturesForOneLayer — handling layers with features within the data", () => {
    it("wraps pre-resolved features as JSON FeatureData without any call to the identify endpoint", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-preresolved",
        layerId: LAYER_ID,
        preResolvedFeatures: vectorFeatures.features,
        layerName: null,
      };

      const result = await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(vectorFeatures.features.length);
      expect(result[0]).toEqual({
        featureId: String(vectorFeatures.features[0]!.id),
        geometry: vectorFeatures.features[0]!.geometry,
        content: {
          kind: "json",
          properties: vectorFeatures.features[0]!.properties ?? {},
        },
      });
    });

    it("slices pre-resolved features down to the limit", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-preresolved",
        layerId: LAYER_ID,
        preResolvedFeatures: vectorFeatures.features,
        layerName: null,
      };

      const result = await getFeaturesForOneLayer(layer, EXTENT, EPSG, LANG, 1);

      expect(result).toHaveLength(1);
      expect(result[0]!.featureId).toBe(String(vectorFeatures.features[0]!.id));
    });
  });

  describe("getFeaturesForOneLayer — handling layers with a identify template", () => {
    it("builds the identify URL from the template and returns trusted html features on 200", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
      fetchSpy.mockImplementation((url: string) => {
        if (url.includes("/identify")) {
          return Promise.resolve(mockResponse(identifyResponse));
        }
        return Promise.resolve(mockResponse(htmlPopup));
      });

      const result = await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      // identify URL shape
      const identifyUrl = fetchSpy.mock.calls[0]![0] as string;
      expect(identifyUrl).toContain("/MapServer/identify");
      expect(identifyUrl).toContain(`layers=all:${LAYER_ID}`);
      expect(identifyUrl).toContain("sr=2056");
      expect(identifyUrl).toContain("geometry=2599000,1199000,2601000,1201000");
      expect(identifyUrl).toContain("geometryType=esriGeometryEnvelope");
      expect(identifyUrl).toContain("geometryFormat=geojson");
      expect(identifyUrl).toContain("limit=10");
      expect(identifyUrl).toContain("tolerance=0");
      expect(identifyUrl).toContain("returnGeometry=true");
      expect(identifyUrl).toContain("lang=de");

      // htmlPopup URL: both {featureId} and {lang} are substituted from the template
      const firstFeatureId = String(identifyResponse.results[0]!.id);
      const popupUrl = fetchSpy.mock.calls[1]![0] as string;
      expect(popupUrl).toBe(
        URL_TEMPLATE.replace("{featureId}", firstFeatureId).replace(
          "{lang}",
          LANG,
        ),
      );

      expect(result).toHaveLength(identifyResponse.results.length);
      expect(result[0]).toEqual({
        featureId: firstFeatureId,
        geometry: identifyResponse.results[0]!.geometry,
        content: {
          kind: "html",
          html: htmlPopup,
          trusted: true,
          shareable: true,
        },
      });
    });

    it("substitutes {lang} so the htmlPopup follows the runtime locale", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
      fetchSpy.mockImplementation((url: string) =>
        url.includes("/identify")
          ? Promise.resolve(mockResponse(identifyResponse))
          : Promise.resolve(mockResponse(htmlPopup)),
      );

      await getFeaturesForOneLayer(layer, EXTENT, EPSG, "fr", 10);

      const popupUrls = fetchSpy.mock.calls
        .map((call) => call[0] as string)
        .filter((url) => url.includes("/htmlPopup"));
      for (const url of popupUrls) {
        expect(url).toContain("lang=fr");
        expect(url).not.toContain("{lang}");
      }
    });

    it("returns an empty array and warns when the identify endpoint answers non-200", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
      fetchSpy.mockResolvedValue(mockResponse("", 500));

      const result = await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining("500"));
      expect(log.warn).toHaveBeenCalledWith(expect.stringContaining(LAYER_ID));
    });

    it("returns an empty array when the identify response has no results", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
      fetchSpy.mockResolvedValue(mockResponse(identifyResponseEmpty));

      const result = await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // identify only
    });

    it("keeps successful popup fetches and silently drops failed ones (per-feature resilience)", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
      const firstFeatureId = String(identifyResponse.results[0]!.id);

      fetchSpy.mockImplementation((url: string) => {
        if (url.includes("/identify")) {
          return Promise.resolve(mockResponse(identifyResponse));
        }
        if (url.includes(`/${firstFeatureId}/htmlPopup`)) {
          return Promise.resolve(mockResponse(htmlPopup));
        }
        return Promise.reject(new Error("popup network failure"));
      });

      const result = await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.featureId).toBe(firstFeatureId);
    });

    it("threads the abort signal into every fetch call", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
      const controller = new AbortController();
      fetchSpy.mockResolvedValue(mockResponse(identifyResponseEmpty));

      await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
        controller.signal,
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe("abort signal handling", () => {
    function identifyLayer(): LayerRequest {
      return {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
        baseUrl: BASE_URL,
        layerName: null,
      };
    }

    it("threads the signal into the identify fetch and every htmlPopup fetch", async () => {
      fetchSpy.mockImplementation((url: string) =>
        url.includes("/identify")
          ? Promise.resolve(mockResponse(identifyResponse))
          : Promise.resolve(mockResponse(htmlPopup)),
      );
      const controller = new AbortController();

      await getFeaturesForOneLayer(
        identifyLayer(),
        EXTENT,
        EPSG,
        LANG,
        10,
        controller.signal,
      );

      expect(fetchSpy).toHaveBeenCalledTimes(
        1 + identifyResponse.results.length,
      );
      for (const call of fetchSpy.mock.calls) {
        expect(call[1]).toEqual({ signal: controller.signal });
      }
    });

    it("rejects the identify fetch when the signal is already aborted, logs it and keeps the other layers intact", async () => {
      const controller = new AbortController();
      const abortError = new DOMException(
        "The operation was aborted.",
        "AbortError",
      );
      // mirrors real fetch semantics: an already-aborted signal rejects immediately
      fetchSpy.mockImplementation((_url: string, init?: RequestInit) =>
        init?.signal?.aborted
          ? Promise.reject(abortError)
          : Promise.resolve(mockResponse(identifyResponse)),
      );
      controller.abort();

      await selectFeatures(
        EXTENT,
        EPSG,
        LANG,
        [
          {
            layerUuid: "uuid-aborted",
            layerId: LAYER_ID,
            getFeatureInfoInformation: geoadminInfo,
            layerName: null,
          },
          {
            layerUuid: "uuid-ok",
            layerId: LAYER_ID,
            preResolvedFeatures: vectorFeatures.features,
            layerName: null,
          },
        ],
        FEATURE_LIMIT,
        controller.signal,
      );

      expect(log.error).toHaveBeenCalledWith(abortError);
      const store = useFeaturesStore();
      expect(store.selectedFeaturesByUuid["uuid-aborted"]).toBeUndefined();
      expect(store.selectedFeaturesByUuid["uuid-ok"]).toHaveLength(
        vectorFeatures.features.length,
      );
    });

    it("contains a mid-flight abort of the identify request: no unhandled rejection, selection is reset", async () => {
      const store = useFeaturesStore();
      store.setSelection({ "uuid-preexisting": [featureData("old")] });

      const controller = new AbortController();
      const abortError = new DOMException("signal aborted", "AbortError");
      fetchSpy.mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            controller.signal.addEventListener("abort", () =>
              reject(abortError),
            );
          }),
      );

      const selection = selectFeatures(
        EXTENT,
        EPSG,
        LANG,
        [
          {
            layerUuid: "uuid-abort",
            layerId: LAYER_ID,
            getFeatureInfoInformation: geoadminInfo,
            layerName: null,
          },
        ],
        FEATURE_LIMIT,
        controller.signal,
      );

      controller.abort();
      await expect(selection).resolves.toBeUndefined();
      expect(log.error).toHaveBeenCalledWith(abortError);
      expect(store.selectedFeaturesByUuid).toEqual({});
      expect(store.hasSelectedFeatures).toBe(false);
    });

    it("keeps popup fetches that resolved and drops the ones aborted mid-flight (per-feature resilience)", async () => {
      const controller = new AbortController();
      const abortError = new DOMException("signal aborted", "AbortError");
      const firstFeatureId = String(identifyResponse.results[0]!.id);
      fetchSpy.mockImplementation((url: string) => {
        if (url.includes("/identify")) {
          return Promise.resolve(mockResponse(identifyResponse));
        }
        if (url.includes(`/${firstFeatureId}/htmlPopup`)) {
          return Promise.resolve(mockResponse(htmlPopup));
        }
        return new Promise((_resolve, reject) => {
          controller.signal.addEventListener("abort", () => reject(abortError));
        });
      });

      const selection = getFeaturesForOneLayer(
        identifyLayer(),
        EXTENT,
        EPSG,
        LANG,
        10,
        controller.signal,
      );
      await vi.waitFor(() =>
        expect(fetchSpy).toHaveBeenCalledTimes(
          1 + identifyResponse.results.length,
        ),
      );

      controller.abort();
      const result = await selection;

      expect(result).toHaveLength(1);
      expect(result[0]!.featureId).toBe(firstFeatureId);
    });
  });

  describe("getFeaturesForOneLayer without explicit uri template nor present data", () => {
    it("returns an empty array without fetching when the layer has no information on how to retrieve features", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-empty",
        layerId: LAYER_ID,
        layerName: null,
      };

      const result = await getFeaturesForOneLayer(
        layer,
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("selectFeatures — handling requests coming from the main module", () => {
    it("stores fulfilled results in the feature store keyed by layerUuid", async () => {
      const layers: LayerSource[] = [
        {
          layerUuid: "uuid-a",
          layerId: LAYER_ID,
          preResolvedFeatures: [vectorFeatures.features[0]!],
          layerName: null,
        },
        {
          layerUuid: "uuid-b",
          layerId: LAYER_ID,
          preResolvedFeatures: [vectorFeatures.features[1]!],
          layerName: null,
        },
      ];

      await selectFeatures(EXTENT, EPSG, LANG, layers);

      const store = useFeaturesStore();
      expect(Object.keys(store.selectedFeaturesByUuid).sort()).toEqual([
        "uuid-a",
        "uuid-b",
      ]);
      expect(store.selectedFeaturesByUuid["uuid-a"]![0]!.featureId).toBe(
        String(vectorFeatures.features[0]!.id),
      );
      expect(store.selectedFeaturesByUuid["uuid-b"]![0]!.featureId).toBe(
        String(vectorFeatures.features[1]!.id),
      );
    });

    it("does not store entries for layers that produced no features", async () => {
      const layers: LayerSource[] = [
        {
          layerUuid: "uuid-a",
          layerId: LAYER_ID,
          preResolvedFeatures: [vectorFeatures.features[0]!],
          layerName: null,
        },
        {
          layerUuid: "uuid-empty",
          layerId: LAYER_ID,
          preResolvedFeatures: [],
          layerName: null,
        },
      ];

      await selectFeatures(EXTENT, EPSG, LANG, layers);

      const store = useFeaturesStore();
      expect(Object.keys(store.selectedFeaturesByUuid)).toEqual(["uuid-a"]);
    });

    it("logs and skips a rejecting layer without breaking the others (Promise.allSettled)", async () => {
      fetchSpy.mockImplementation((url: string) => {
        if (url.includes("/identify")) {
          return Promise.reject(new Error("identify boom"));
        }
        return Promise.resolve(mockResponse(htmlPopup));
      });

      const layers: LayerSource[] = [
        {
          layerUuid: "uuid-fail",
          layerId: LAYER_ID,
          getFeatureInfoInformation: geoadminInfo,
          layerName: null,
        },
        {
          layerUuid: "uuid-ok",
          layerId: LAYER_ID,
          preResolvedFeatures: vectorFeatures.features,
          layerName: null,
        },
      ];

      await selectFeatures(EXTENT, EPSG, LANG, layers);

      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error).toHaveBeenCalledWith(expect.any(Error));
      const store = useFeaturesStore();
      expect(store.selectedFeaturesByUuid["uuid-ok"]).toHaveLength(
        vectorFeatures.features.length,
      );
      expect(store.selectedFeaturesByUuid["uuid-fail"]).toBeUndefined();
    });

    it("resets the store (no popover) when no layer produced features", async () => {
      const store = useFeaturesStore();
      store.setSelection({ "uuid-preexisting": [featureData("old")] });
      expect(store.hasSelectedFeatures).toBe(true);

      await selectFeatures(EXTENT, EPSG, LANG, [
        {
          layerUuid: "uuid-empty",
          layerId: LAYER_ID,
          preResolvedFeatures: [],
          layerName: null,
        },
      ]);

      expect(store.selectedFeaturesByUuid).toEqual({});
      expect(store.hasSelectedFeatures).toBe(false);
    });

    it("parses a real geoadmin:features distribution feature end-to-end", async () => {
      fetchSpy.mockImplementation((url: string) => {
        if (url.includes("/identify")) {
          return Promise.resolve(mockResponse(identifyResponse));
        }
        return Promise.resolve(mockResponse(htmlPopup));
      });

      await selectFeatures(EXTENT, EPSG, LANG, [
        {
          layerUuid: "uuid-ogc",
          layerId: LAYER_ID,
          getFeatureInfoInformation: geoadminInfo,
          layerName: null,
        },
      ]);

      const identifyUrl = fetchSpy.mock.calls[0]![0] as string;
      expect(identifyUrl).toContain(`layers=all:${LAYER_ID}`);

      const store = useFeaturesStore();
      expect(store.selectedFeaturesByUuid["uuid-ogc"]).toHaveLength(
        identifyResponse.results.length,
      );
      expect(store.selectedFeaturesByUuid["uuid-ogc"]![0]).toEqual({
        featureId: String(identifyResponse.results[0]!.id),
        geometry: identifyResponse.results[0]!.geometry,
        content: {
          kind: "html",
          html: htmlPopup,
          trusted: true,
          shareable: true,
        },
      });
    });
  });

  describe("getFeaturesForOneLayer — handling WMS layers with a GetFeatureInfo capability", () => {
    const WMS_BASE_URL = "https://example.test/wms?";

    function makeWmsRequest(
      overrides: Partial<WMSLayerRequest> = {},
    ): WMSLayerRequest {
      return {
        layerUuid: "uuid-wms",
        layerId: "ch.test.wms-layer",
        layerName: null,
        wmsGetFeatureInfo: {
          baseUrl: WMS_BASE_URL,
          method: "GET",
          formats: ["application/vnd.ogc.gml", "application/json"],
        },
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        ...overrides,
      };
    }

    function fetchedUrl(call = 0): URL {
      return new URL(String(fetchSpy.mock.calls[call]![0]));
    }

    it("builds a GetFeatureInfo request with the full param set (WMS 1.3.0 default)", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(makeWmsRequest(), EXTENT, EPSG, LANG, 7);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const url = fetchedUrl();
      expect(`${url.origin}${url.pathname}`).toBe("https://example.test/wms");
      const params = url.searchParams;
      expect(params.get("SERVICE")).toBe("WMS");
      expect(params.get("REQUEST")).toBe("GetFeatureInfo");
      expect(params.get("VERSION")).toBe("1.3.0");
      expect(params.get("LAYERS")).toBe("ch.test.wms-layer");
      expect(params.get("QUERY_LAYERS")).toBe("ch.test.wms-layer");
      expect(params.get("CRS")).toBe("EPSG:2056");
      expect(params.get("BBOX")).toBe(EXTENT.join(","));
      expect(params.get("WIDTH")).toBe("100");
      expect(params.get("HEIGHT")).toBe("100");
      expect(params.get("I")).toBe("50");
      expect(params.get("J")).toBe("50");
      expect(params.get("FEATURE_COUNT")).toBe("7");
      expect(params.get("LANG")).toBe(LANG);
      expect(params.get("INFO_FORMAT")).toBe("application/json");
      expect(params.get("TOLERANCE")).toBe("10");
      expect(params.get("BUFFER")).toBe("10");
      expect(params.get("FI_POINT_TOLERANCE")).toBe("10");
      expect(params.get("FI_LINE_TOLERANCE")).toBe("10");
      expect(params.get("FI_POLYGON_TOLERANCE")).toBe("10");
      // 1.3.0 must not carry the legacy axis params
      expect(params.get("SRS")).toBeNull();
      expect(params.get("X")).toBeNull();
      expect(params.get("Y")).toBeNull();
    });

    it("queries with the stored layerName instead of the layerId when present", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(
        makeWmsRequest({ layerName: "wms.layer.name" }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      const params = fetchedUrl().searchParams;
      expect(params.get("LAYERS")).toBe("wms.layer.name");
      expect(params.get("QUERY_LAYERS")).toBe("wms.layer.name");
    });

    it("falls back to the layerId for LAYERS/QUERY_LAYERS when no layerName is stored", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(
        makeWmsRequest({ layerName: null }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      const params = fetchedUrl().searchParams;
      expect(params.get("LAYERS")).toBe("ch.test.wms-layer");
      expect(params.get("QUERY_LAYERS")).toBe("ch.test.wms-layer");
    });

    it("uses the legacy SRS/X/Y params for pre-1.3.0 versions", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(
        makeWmsRequest({ wmsVersion: "1.1.1" }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      const params = fetchedUrl().searchParams;
      expect(params.get("VERSION")).toBe("1.1.1");
      expect(params.get("SRS")).toBe("EPSG:2056");
      expect(params.get("X")).toBe("50");
      expect(params.get("Y")).toBe("50");
      expect(params.get("CRS")).toBeNull();
      expect(params.get("I")).toBeNull();
      expect(params.get("J")).toBeNull();
    });

    it("defaults an invalid version to 1.3.0", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(
        makeWmsRequest({ wmsVersion: "not-a-version" }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(fetchedUrl().searchParams.get("VERSION")).toBe("1.3.0");
    });

    it("keeps the params in the query string for POST capabilities", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(
        makeWmsRequest({
          wmsGetFeatureInfo: {
            baseUrl: WMS_BASE_URL,
            method: "POST",
            formats: ["application/json"],
          },
        }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(fetchSpy.mock.calls[0]![1]).toMatchObject({ method: "POST" });
      expect(fetchedUrl().searchParams.get("SERVICE")).toBe("WMS");
    });

    it("skips the layer without any request when the active CRS is not supported", async () => {
      const result = await getFeaturesForOneLayer(
        makeWmsRequest({ availableCrs: ["EPSG:4326"] }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("skips the layer without any request when no format is negotiable", async () => {
      const result = await getFeaturesForOneLayer(
        makeWmsRequest({
          wmsGetFeatureInfo: {
            baseUrl: WMS_BASE_URL,
            method: "GET",
            formats: ["application/vnd.ogc.gml", "image/png"],
          },
        }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(log.debug).toHaveBeenCalled();
    });

    it("accepts application/json with a parameter suffix as INFO_FORMAT", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      await getFeaturesForOneLayer(
        makeWmsRequest({
          wmsGetFeatureInfo: {
            baseUrl: WMS_BASE_URL,
            method: "GET",
            formats: ["application/json; subtype=geojson"],
          },
        }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(fetchedUrl().searchParams.get("INFO_FORMAT")).toBe(
        "application/json; subtype=geojson",
      );
    });

    it("wraps a text/html response as a single unshareable html feature, passed through untouched", async () => {
      // Some WMS services answer with several concatenated "full"
      // html documents in one body. We deliberately do not handle these in
      // a specific manner (for example: no splitting): the blob is passed
      // through byte-identical as one feature.
      const htmlBlob =
        "<html><body><p>first feature popup</p></body></html>" +
        "<html><body><p>second feature popup</p></body></html>";
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse(htmlBlob)),
      );

      const result = await getFeaturesForOneLayer(
        makeWmsRequest({
          wmsGetFeatureInfo: {
            baseUrl: WMS_BASE_URL,
            method: "GET",
            formats: ["text/html"],
          },
        }),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(fetchedUrl().searchParams.get("INFO_FORMAT")).toBe("text/html");
      expect(result).toEqual([
        {
          featureId: expect.any(String),
          geometry: null,
          content: {
            kind: "html",
            html: htmlBlob,
            trusted: true,
            shareable: false,
          },
        },
      ]);
    });

    it("maps response features to FeatureData, resolving ids and tolerating null properties/geometry", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(
          mockResponse({
            features: [
              {
                type: "Feature",
                id: "wms-1",
                properties: { name: "a name" },
                geometry: { type: "Point", coordinates: [1, 2] },
              },
              {
                type: "Feature",
                properties: { identifier: "wms-2" },
                geometry: null,
              },
              {
                type: "Feature",
                properties: null,
                geometry: { type: "Point", coordinates: [3, 4] },
              },
            ],
          }),
        ),
      );

      const result = await getFeaturesForOneLayer(
        makeWmsRequest(),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        featureId: "wms-1",
        geometry: { type: "Point", coordinates: [1, 2] },
        content: { kind: "json", properties: { name: "a name" } },
      });
      // missing geometries remain null
      expect(result[1]).toEqual({
        featureId: "wms-2",
        geometry: null,
        content: { kind: "json", properties: { identifier: "wms-2" } },
      });
      // null properties become an empty record; a random id is generated
      expect(result[2]!.content).toEqual({
        kind: "json",
        properties: {},
      });
      expect(result[2]!.featureId).toEqual(expect.any(String));
      expect(result[2]!.featureId).not.toBe("");
    });

    it("returns an empty array with a warning on a non-200 response", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] }, 500)),
      );

      const result = await getFeaturesForOneLayer(
        makeWmsRequest(),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(log.warn).toHaveBeenCalled();
    });

    it("returns an empty array with a warning for an unrecognized response shape", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ results: [{ layerName: "x" }] })),
      );

      const result = await getFeaturesForOneLayer(
        makeWmsRequest(),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(log.warn).toHaveBeenCalled();
    });

    it("returns an empty array silently for an empty FeatureCollection", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );

      const result = await getFeaturesForOneLayer(
        makeWmsRequest(),
        EXTENT,
        EPSG,
        LANG,
        10,
      );

      expect(result).toEqual([]);
      expect(log.warn).not.toHaveBeenCalled();
    });

    it("threads the abort signal into the request", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse({ features: [] })),
      );
      const controller = new AbortController();

      await getFeaturesForOneLayer(
        makeWmsRequest(),
        EXTENT,
        EPSG,
        LANG,
        10,
        controller.signal,
      );

      expect(fetchSpy.mock.calls[0]![1]).toMatchObject({
        signal: controller.signal,
      });
    });
  });

  describe("selectFeatures — WMS sources", () => {
    it("resolves capabilities from the store, stores results per layer, and drops unsupported CRS layers", async () => {
      const store = useFeaturesStore();
      store.setWmsCapability("uuid-wms-a", {
        getFeatureInfoCapability: {
          baseUrl: "https://example.test/wms-a?",
          method: "GET",
          formats: ["application/json"],
        },
        availableCrs: ["EPSG:2056"],
        layerName: null,
      });
      store.setWmsCapability("uuid-wms-b", {
        getFeatureInfoCapability: {
          baseUrl: "https://example.test/wms-b?",
          method: "GET",
          formats: ["application/json"],
        },
        availableCrs: ["EPSG:4326"],
        layerName: null,
      });
      fetchSpy.mockImplementation((url: string) => {
        if (String(url).includes("wms-a")) {
          return Promise.resolve(
            mockResponse({
              features: [
                {
                  type: "Feature",
                  id: "wms-a-1",
                  properties: { name: "from wms a" },
                  geometry: { type: "Point", coordinates: [1, 2] },
                },
              ],
            }),
          );
        }
        return Promise.resolve(mockResponse({ features: [] }));
      });

      await selectFeatures(EXTENT, EPSG, LANG, [
        { layerUuid: "uuid-wms-a", layerId: "layer-a", layerName: null },
        { layerUuid: "uuid-wms-b", layerId: "layer-b", layerName: null },
      ]);

      expect(Object.keys(store.selectedFeaturesByUuid)).toEqual(["uuid-wms-a"]);
      expect(store.selectedFeaturesByUuid["uuid-wms-a"]![0]).toEqual({
        featureId: "wms-a-1",
        geometry: { type: "Point", coordinates: [1, 2] },
        content: { kind: "json", properties: { name: "from wms a" } },
      });
      // only the supported layer fired a request
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("keeps identify primary for layers where there is both a geoadmin:features and a geoadmin:wms protocol", async () => {
      const store = useFeaturesStore();
      store.setWmsCapability("uuid-dual", {
        getFeatureInfoCapability: {
          baseUrl: "https://example.test/wms?",
          method: "GET",
          formats: ["application/json"],
        },
        availableCrs: ["EPSG:2056"],
        layerName: null,
      });
      fetchSpy.mockImplementation((url: string) => {
        if (String(url).includes("/identify")) {
          return Promise.resolve(mockResponse({}, 500));
        }
        return Promise.resolve(
          mockResponse({
            features: [
              {
                type: "Feature",
                id: "should-not-happen",
                properties: {},
                geometry: { type: "Point", coordinates: [0, 0] },
              },
            ],
          }),
        );
      });

      await selectFeatures(EXTENT, EPSG, LANG, [
        {
          layerUuid: "uuid-dual",
          layerId: LAYER_ID,
          getFeatureInfoInformation: geoadminInfo,
          layerName: null,
        },
      ]);

      expect(store.selectedFeaturesByUuid).toEqual({});
      // the failed identify ran, the WMS endpoint was never consulted
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(String(fetchSpy.mock.calls[0]![0])).toContain("/identify");
    });

    it("use pre-existing features without firing any queries", async () => {
      const store = useFeaturesStore();

      await selectFeatures(EXTENT, EPSG, LANG, [
        {
          layerUuid: "uuid-file",
          layerId: "some.kml.file",
          preResolvedFeatures: vectorFeatures.features,
          layerName: null,
        },
      ]);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(store.selectedFeaturesByUuid["uuid-file"]).toHaveLength(
        vectorFeatures.features.length,
      );
    });
  });

  describe("createIdentifyResponse — restoring feature ids from the state import", () => {
    beforeEach(() => {
      vi.stubEnv("NUXT_GEOADMIN_API_BASE_URL", "https://api.example.test");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("queries the getFeatures endpoint with the joined ids and maps the results", async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(mockResponse(identifyResponse)),
      );

      const features = await createIdentifyResponse(
        ["id-1", "id-2"],
        "ch.test.layer",
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(String(fetchSpy.mock.calls[0]![0])).toBe(
        "https://api.example.test/rest/services/ech/MapServer/ch.test.layer/id-1,id-2",
      );
      expect(features).toEqual(
        identifyResponse.results.map((result) => ({
          id: result.id,
          geometry: result.geometry,
        })),
      );
    });

    it("warns and returns an empty array when the server answers a non-200", async () => {
      fetchSpy.mockImplementation(() => Promise.resolve(mockResponse({}, 500)));

      const features = await createIdentifyResponse(["id-1"], "ch.test.layer");

      expect(features).toEqual([]);
      expect(log.warn).toHaveBeenCalled();
    });

    it("returns an empty array when the payload has no results field", async () => {
      fetchSpy.mockImplementation(() => Promise.resolve(mockResponse({})));

      const features = await createIdentifyResponse(["id-1"], "ch.test.layer");

      expect(features).toEqual([]);
    });
  });
});
