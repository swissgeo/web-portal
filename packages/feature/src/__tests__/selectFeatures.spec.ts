import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  OgcDistribution,
} from "@/types";

import { FEATURE_LIMIT } from "@/constants";
import { getFeaturesForOneLayer, selectFeatures } from "@/selectFeatures";
import { useFeaturesStore } from "@/stores/feature";

import distributionCollectionJson from "./fixtures/distributionCollection_ch.astra.json";
import htmlPopup from "./fixtures/htmlPopup_ch.astra";
import identifyResponse from "./fixtures/identifyResponse_ch.astra.json";
import identifyResponseEmpty from "./fixtures/identifyResponse_empty.json";
import vectorFeaturesJson from "./fixtures/vectorFeatures.json";

const distributionCollection =
  distributionCollectionJson as unknown as OgcDistribution;
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
        content: { kind: "html", html: htmlPopup, trusted: true },
      });
    });

    it("substitutes {lang} so the htmlPopup follows the runtime locale", async () => {
      const layer: LayerRequest = {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        urlTemplate: URL_TEMPLATE,
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
            kind: "geoadmin",
            layerUuid: "uuid-aborted",
            layerId: LAYER_ID,
            distribution: distributionCollection,
          },
          {
            kind: "geoadmin",
            layerUuid: "uuid-ok",
            layerId: LAYER_ID,
            preResolvedFeatures: vectorFeatures.features,
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
            kind: "geoadmin",
            layerUuid: "uuid-abort",
            layerId: LAYER_ID,
            distribution: distributionCollection,
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
          kind: "geoadmin",
          layerUuid: "uuid-a",
          layerId: LAYER_ID,
          preResolvedFeatures: [vectorFeatures.features[0]!],
        },
        {
          kind: "geoadmin",
          layerUuid: "uuid-b",
          layerId: LAYER_ID,
          preResolvedFeatures: [vectorFeatures.features[1]!],
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
          kind: "geoadmin",
          layerUuid: "uuid-a",
          layerId: LAYER_ID,
          preResolvedFeatures: [vectorFeatures.features[0]!],
        },
        {
          kind: "geoadmin",
          layerUuid: "uuid-empty",
          layerId: LAYER_ID,
          preResolvedFeatures: [],
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
          kind: "geoadmin",
          layerUuid: "uuid-fail",
          layerId: LAYER_ID,
          distribution: distributionCollection,
        },
        {
          kind: "geoadmin",
          layerUuid: "uuid-ok",
          layerId: LAYER_ID,
          preResolvedFeatures: vectorFeatures.features,
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
          kind: "geoadmin",
          layerUuid: "uuid-empty",
          layerId: LAYER_ID,
          preResolvedFeatures: [],
        },
      ]);

      expect(store.selectedFeaturesByUuid).toEqual({});
      expect(store.hasSelectedFeatures).toBe(false);
    });

    it("parses a real OGC distribution end-to-end (ignores wmts/wms distributions)", async () => {
      fetchSpy.mockImplementation((url: string) => {
        if (url.includes("/identify")) {
          return Promise.resolve(mockResponse(identifyResponse));
        }
        return Promise.resolve(mockResponse(htmlPopup));
      });

      await selectFeatures(EXTENT, EPSG, LANG, [
        {
          kind: "geoadmin",
          layerUuid: "uuid-ogc",
          layerId: LAYER_ID,
          distribution: distributionCollection,
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
        content: { kind: "html", html: htmlPopup, trusted: true },
      });
    });
  });
});
