import type { Feature as GeoJsonFeature } from "geojson";

import { describe, expect, it } from "vitest";

import type { LayerSource, WmsFeatureInfoCapability } from "@/types";

import {
  sourceToLayerRequest,
  sourcesToLayerRequests,
} from "@/utils/sourceToLayerRequest";

const UUID = "uuid-test";
const LAYER_ID = "ch.test.layer";
const BASE_URL = "https://example.test/MapServer";
const TEMPLATE = `${BASE_URL}/${LAYER_ID}/{featureId}/htmlPopup?lang={lang}`;

function makeFeature(id: string | number = 1): GeoJsonFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: {},
  };
}

const geoadminInfo = (
  overrides: Partial<LayerSource["getFeatureInfoInformation"]> = {},
) => ({
  protocol: "geoadmin:features",
  baseUrl: BASE_URL,
  ...overrides,
});

function makeSource(overrides: Partial<LayerSource> = {}): LayerSource {
  return {
    layerUuid: UUID,
    layerId: LAYER_ID,
    layerName: null,
    ...overrides,
  };
}

const wmsCapability = (
  overrides: Partial<WmsFeatureInfoCapability> = {},
): WmsFeatureInfoCapability => ({
  getFeatureInfoCapability: {
    baseUrl: "https://example.test/wms?",
    method: "GET",
    formats: ["application/vnd.ogc.gml", "application/json"],
  },
  availableCrs: ["EPSG:4326", "EPSG:2056"],
  layerName: null,
  ...overrides,
});

describe("sourceToLayerRequest", () => {
  describe("priority 1 — pre-resolved features", () => {
    it("returns a pre-resolved request, even if geoadmin:features feature info is present", () => {
      const features = [makeFeature(1), makeFeature(2)];

      const request = sourceToLayerRequest(
        makeSource({
          getFeatureInfoInformation: geoadminInfo(),
          preResolvedFeatures: features,
        }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
        layerName: LAYER_ID,
      });
      expect(request).not.toHaveProperty("urlTemplate");
    });

    it("returns a pre-resolved request without any feature info", () => {
      const features = [makeFeature(1)];

      const request = sourceToLayerRequest(
        makeSource({ preResolvedFeatures: features }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
        layerName: LAYER_ID,
      });
    });

    it("keeps a stored layerName over the layerId fallback", () => {
      const features = [makeFeature(1)];

      const request = sourceToLayerRequest(
        makeSource({
          preResolvedFeatures: features,
          layerName: "wms.layer.name",
        }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
        layerName: "wms.layer.name",
      });
    });

    it("keeps pre-resolved features winning over a registered WMS capability", () => {
      const features = [makeFeature(1)];

      const request = sourceToLayerRequest(
        makeSource({ preResolvedFeatures: features }),
        { [UUID]: wmsCapability() },
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
        layerName: LAYER_ID,
      });
    });

    it("falls back to the feature info when preResolvedFeatures is an empty array", () => {
      const request = sourceToLayerRequest(
        makeSource({
          getFeatureInfoInformation: geoadminInfo(),
          preResolvedFeatures: [],
        }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        baseUrl: BASE_URL,
        urlTemplate: TEMPLATE,
        layerName: LAYER_ID,
      });
    });
  });

  describe("priority 2 — identify feature info", () => {
    it("builds the urlTemplate from the geoadmin:features baseUrl and the layerId", () => {
      const request = sourceToLayerRequest(
        makeSource({ getFeatureInfoInformation: geoadminInfo() }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        baseUrl: BASE_URL,
        urlTemplate: TEMPLATE,
        layerName: LAYER_ID,
      });
      expect(request).not.toHaveProperty("preResolvedFeatures");
    });

    it("accepts the ogc:api3features protocol (ticket-mandated safeguard)", () => {
      const request = sourceToLayerRequest(
        makeSource({
          getFeatureInfoInformation: geoadminInfo({
            protocol: "ogc:api3features",
          }),
        }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        baseUrl: BASE_URL,
        urlTemplate: TEMPLATE,
        layerName: LAYER_ID,
      });
    });

    it("keeps the identify urlTemplate winning over a registered WMS capability", () => {
      const request = sourceToLayerRequest(
        makeSource({ getFeatureInfoInformation: geoadminInfo() }),
        { [UUID]: wmsCapability() },
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        baseUrl: BASE_URL,
        urlTemplate: TEMPLATE,
        layerName: LAYER_ID,
      });
    });

    it("falls through to the WMS capability when the protocol is not identify-capable", () => {
      const request = sourceToLayerRequest(
        makeSource({
          getFeatureInfoInformation: geoadminInfo({ protocol: "ogc:wms" }),
        }),
        { [UUID]: wmsCapability() },
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        wmsGetFeatureInfo: wmsCapability().getFeatureInfoCapability,
        wmsVersion: "1.3.0",
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        layerName: null,
      });
    });

    it("falls through to the WMS capability when there is no baseUrl", () => {
      const request = sourceToLayerRequest(
        makeSource({
          getFeatureInfoInformation: geoadminInfo({ baseUrl: undefined }),
        }),
        { [UUID]: wmsCapability() },
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        wmsGetFeatureInfo: wmsCapability().getFeatureInfoCapability,
        wmsVersion: "1.3.0",
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        layerName: null,
      });
    });

    it("returns an empty request for unsupported protocols when no capability is registered", () => {
      expect(
        sourceToLayerRequest(
          makeSource({
            getFeatureInfoInformation: geoadminInfo({ protocol: "ogc:wms" }),
          }),
        ),
      ).toEqual({ layerUuid: UUID, layerId: LAYER_ID, layerName: LAYER_ID });
      expect(
        sourceToLayerRequest(
          makeSource({
            getFeatureInfoInformation: geoadminInfo({ protocol: "ogc:wmts" }),
          }),
        ),
      ).toEqual({ layerUuid: UUID, layerId: LAYER_ID, layerName: LAYER_ID });
    });
  });

  describe("registered WMS capability", () => {
    it("builds a WMSLayerRequest from the dict entry, version defaulted", () => {
      const request = sourceToLayerRequest(makeSource(), {
        [UUID]: wmsCapability({
          getFeatureInfoCapability: {
            baseUrl: "https://example.test/wms?",
            method: "GET",
            formats: ["application/json"],
          },
        }),
      });

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        wmsGetFeatureInfo: {
          baseUrl: "https://example.test/wms?",
          method: "GET",
          formats: ["application/json"],
        },
        wmsVersion: "1.3.0",
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        layerName: null,
      });
    });

    it("passes the wmsVersion through when present", () => {
      const request = sourceToLayerRequest(makeSource(), {
        [UUID]: wmsCapability({ wmsVersion: "1.1.1" }),
      });

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        wmsGetFeatureInfo: wmsCapability().getFeatureInfoCapability,
        wmsVersion: "1.1.1",
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        layerName: null,
      });
    });

    it("passes the capability's layerName through (WMS <Name>, not the dataset id)", () => {
      const request = sourceToLayerRequest(makeSource(), {
        [UUID]: wmsCapability({ layerName: "wms.layer.name" }),
      });

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        wmsGetFeatureInfo: wmsCapability().getFeatureInfoCapability,
        wmsVersion: "1.3.0",
        availableCrs: ["EPSG:4326", "EPSG:2056"],
        layerName: "wms.layer.name",
      });
    });

    it("returns an empty request when the layer has no dict entry", () => {
      const request = sourceToLayerRequest(makeSource());

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        layerName: LAYER_ID,
      });
    });

    it("ignores dict entries of other layers", () => {
      const request = sourceToLayerRequest(makeSource(), {
        "another-uuid": wmsCapability(),
      });

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        layerName: LAYER_ID,
      });
    });

    it("returns an empty request for a bare source with neither feature info, features nor entry", () => {
      const request = sourceToLayerRequest(makeSource());

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        layerName: LAYER_ID,
      });
    });
  });
});

describe("sourcesToLayerRequests", () => {
  it("maps each source to a request, preserving order, with the dict injected", () => {
    const capability = wmsCapability();
    const sources: LayerSource[] = [
      makeSource({
        layerUuid: "uuid-preresolved",
        preResolvedFeatures: [makeFeature(1)],
      }),
      makeSource({
        layerUuid: "uuid-identify",
        getFeatureInfoInformation: geoadminInfo(),
      }),
      makeSource({ layerUuid: "uuid-wms" }),
      makeSource({ layerUuid: "uuid-empty" }),
    ];

    const requests = sourcesToLayerRequests(sources, {
      "uuid-wms": capability,
    });

    expect(requests).toEqual([
      {
        layerUuid: "uuid-preresolved",
        layerId: LAYER_ID,
        preResolvedFeatures: [makeFeature(1)],
        layerName: LAYER_ID,
      },
      {
        layerUuid: "uuid-identify",
        layerId: LAYER_ID,
        baseUrl: BASE_URL,
        urlTemplate: TEMPLATE,
        layerName: LAYER_ID,
      },
      {
        layerUuid: "uuid-wms",
        layerId: LAYER_ID,
        wmsGetFeatureInfo: capability.getFeatureInfoCapability,
        wmsVersion: "1.3.0",
        availableCrs: capability.availableCrs,
        layerName: null,
      },
      { layerUuid: "uuid-empty", layerId: LAYER_ID, layerName: LAYER_ID },
    ]);
  });

  it("returns an empty array when given no sources", () => {
    expect(sourcesToLayerRequests([])).toEqual([]);
  });
});
