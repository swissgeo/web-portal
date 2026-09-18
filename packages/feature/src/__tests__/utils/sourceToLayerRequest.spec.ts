import type { Feature as GeoJsonFeature } from "geojson";

import { describe, expect, it } from "vitest";

import type {
  LayerSource,
  OgcDistributionFeature,
  WmsFeatureInfoCapability,
} from "@/types";

import {
  sourceToLayerRequest,
  sourcesToLayerRequests,
} from "@/utils/sourceToLayerRequest";

const UUID = "uuid-test";
const LAYER_ID = "ch.test.layer";
const TEMPLATE = `https://example.test/MapServer/${LAYER_ID}/{featureId}/htmlPopup?lang={lang}`;

function makeFeature(id: string | number = 1): GeoJsonFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: {},
  };
}

function makeDistributionFeature(
  overrides: Partial<OgcDistributionFeature> = {},
): OgcDistributionFeature {
  return {
    id: "distribution-test",
    links: [],
    linkTemplates: [],
    properties: { type: "distribution", protocol: "geoadmin:features" },
    ...overrides,
  };
}

const geoadminFeature = (): OgcDistributionFeature =>
  makeDistributionFeature({
    linkTemplates: [{ rel: "preview", uriTemplate: TEMPLATE }],
  });

function makeSource(overrides: Partial<LayerSource> = {}): LayerSource {
  return {
    layerUuid: UUID,
    layerId: LAYER_ID,
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
  ...overrides,
});

describe("sourceToLayerRequest", () => {
  describe("priority 1 — pre-resolved features", () => {
    it("returns a pre-resolved request, even if a geoadmin:features distribution feature is present", () => {
      const features = [makeFeature(1), makeFeature(2)];

      const request = sourceToLayerRequest(
        makeSource({
          distributionFeature: geoadminFeature(),
          preResolvedFeatures: features,
        }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
      });
      expect(request).not.toHaveProperty("urlTemplate");
    });

    it("returns a pre-resolved request without any distribution feature", () => {
      const features = [makeFeature(1)];

      const request = sourceToLayerRequest(
        makeSource({ preResolvedFeatures: features }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
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
      });
    });

    it("falls back to the distribution feature when preResolvedFeatures is an empty array", () => {
      const request = sourceToLayerRequest(
        makeSource({
          distributionFeature: geoadminFeature(),
          preResolvedFeatures: [],
        }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        urlTemplate: TEMPLATE,
      });
    });
  });

  describe("priority 2 — geoadmin:features distribution feature", () => {
    it("extracts the preview uriTemplate as urlTemplate", () => {
      const request = sourceToLayerRequest(
        makeSource({ distributionFeature: geoadminFeature() }),
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        urlTemplate: TEMPLATE,
      });
      expect(request).not.toHaveProperty("preResolvedFeatures");
    });

    it("selects the preview rel when several linkTemplates are present", () => {
      const distributionFeature = makeDistributionFeature({
        linkTemplates: [
          { rel: "self", uriTemplate: "https://example.test/self" },
          { rel: "preview", uriTemplate: TEMPLATE },
          { rel: "alternate", uriTemplate: "https://example.test/alt" },
        ],
      });

      const request = sourceToLayerRequest(makeSource({ distributionFeature }));

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        urlTemplate: TEMPLATE,
      });
    });

    it("keeps the identify urlTemplate winning over a registered WMS capability", () => {
      const request = sourceToLayerRequest(
        makeSource({ distributionFeature: geoadminFeature() }),
        { [UUID]: wmsCapability() },
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        urlTemplate: TEMPLATE,
      });
    });

    it("falls through to the WMS capability when the geoadmin feature has no preview template", () => {
      const request = sourceToLayerRequest(
        makeSource({
          distributionFeature: makeDistributionFeature(),
        }),
        { [UUID]: wmsCapability() },
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        wmsGetFeatureInfo: wmsCapability().getFeatureInfoCapability,
        wmsVersion: "1.3.0",
        availableCrs: ["EPSG:4326", "EPSG:2056"],
      });
    });

    it("returns an empty request for non-geoadmin distribution features when no capability is registered", () => {
      const wmsFeature = makeDistributionFeature({
        properties: { type: "distribution", protocol: "ogc:wms" },
      });
      const wmtsFeature = makeDistributionFeature({
        properties: { type: "distribution", protocol: "ogc:wmts" },
      });

      expect(
        sourceToLayerRequest(makeSource({ distributionFeature: wmsFeature })),
      ).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
      expect(
        sourceToLayerRequest(makeSource({ distributionFeature: wmtsFeature })),
      ).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
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
      });
    });

    it("returns an empty request when the layer has no dict entry", () => {
      const request = sourceToLayerRequest(makeSource());

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });

    it("ignores dict entries of other layers", () => {
      const request = sourceToLayerRequest(makeSource(), {
        "another-uuid": wmsCapability(),
      });

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });

    it("returns an empty request for a bare source with neither distribution feature, features nor entry", () => {
      const request = sourceToLayerRequest(makeSource());

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
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
        distributionFeature: geoadminFeature(),
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
      },
      { layerUuid: "uuid-identify", layerId: LAYER_ID, urlTemplate: TEMPLATE },
      {
        layerUuid: "uuid-wms",
        layerId: LAYER_ID,
        wmsGetFeatureInfo: capability.getFeatureInfoCapability,
        wmsVersion: "1.3.0",
        availableCrs: capability.availableCrs,
      },
      { layerUuid: "uuid-empty", layerId: LAYER_ID },
    ]);
  });

  it("returns an empty array when given no sources", () => {
    expect(sourcesToLayerRequests([])).toEqual([]);
  });
});
