import type { Feature as GeoJsonFeature } from "geojson";

import { describe, expect, it } from "vitest";

import type { LayerSource, OgcDistribution } from "@/types";

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

function makeDistribution(
  features: Array<{
    protocol: string;
    linkTemplates?: Array<{ rel?: string; uriTemplate?: string }>;
  }>,
  id: string = LAYER_ID,
): OgcDistribution {
  return {
    id,
    type: "FeatureCollection",
    features: features.map((entry) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [0, 0] },
      properties: { protocol: entry.protocol },
      linkTemplates: entry.linkTemplates,
    })),
  } as OgcDistribution;
}

const geoadminDistribution = (id: string = LAYER_ID): OgcDistribution =>
  makeDistribution(
    [
      {
        protocol: "geoadmin:features",
        linkTemplates: [{ rel: "preview", uriTemplate: TEMPLATE }],
      },
    ],
    id,
  );

describe("sourceToLayerRequest", () => {
  describe("handling requests with pre-existing features", () => {
    it("returns a pre-resolved request when preResolvedFeatures is non-empty, even if a geoadmin:features protocol is present", () => {
      const features = [makeFeature(1), makeFeature(2)];

      const request = sourceToLayerRequest(
        UUID,
        geoadminDistribution(),
        features,
      );

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        preResolvedFeatures: features,
      });
      expect(request).not.toHaveProperty("urlTemplate");
    });

    it("uses the distribution id as layerId when a distribution is present", () => {
      const request = sourceToLayerRequest(
        UUID,
        geoadminDistribution("ch.test.layer"),
        [makeFeature()],
      );

      expect(request.layerId).toBe("ch.test.layer");
    });

    it("falls back to layerId 'undefined' when no distribution is provided", () => {
      const features = [makeFeature()];

      const request = sourceToLayerRequest(UUID, undefined, features);

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: "undefined",
        preResolvedFeatures: features,
      });
    });
  });

  describe("handling requests with a geoadmin:features protocol present", () => {
    it("extracts the preview uriTemplate as urlTemplate", () => {
      const request = sourceToLayerRequest(UUID, geoadminDistribution());

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        urlTemplate: TEMPLATE,
      });
      expect(request).not.toHaveProperty("preResolvedFeatures");
    });

    it("selects the preview rel when several linkTemplates are present", () => {
      const distribution = makeDistribution([
        {
          protocol: "geoadmin:features",
          linkTemplates: [
            { rel: "self", uriTemplate: "https://example.test/self" },
            { rel: "preview", uriTemplate: TEMPLATE },
            { rel: "alternate", uriTemplate: "https://example.test/alt" },
          ],
        },
      ]);

      expect(sourceToLayerRequest(UUID, distribution).urlTemplate).toBe(
        TEMPLATE,
      );
    });

    it("ignores ogc:wmts and ogc:wms distributions", () => {
      const distribution = makeDistribution([
        { protocol: "ogc:wmts" },
        { protocol: "ogc:wms" },
      ]);

      const request = sourceToLayerRequest(UUID, distribution);

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });

    it("falls back to the distribution when preResolvedFeatures is an empty array", () => {
      const request = sourceToLayerRequest(UUID, geoadminDistribution(), []);

      expect(request).toEqual({
        layerUuid: UUID,
        layerId: LAYER_ID,
        urlTemplate: TEMPLATE,
      });
    });
  });

  describe("handling requests with no usable data", () => {
    it("returns an empty request for a distribution without geoadmin:features or pre-existing features", () => {
      const distribution = makeDistribution([{ protocol: "ogc:wms" }]);

      const request = sourceToLayerRequest(UUID, distribution);

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });

    it("returns layerId 'undefined' when neither distribution nor features are provided", () => {
      expect(sourceToLayerRequest(UUID)).toEqual({
        layerUuid: UUID,
        layerId: "undefined",
      });
    });
  });
});

describe("sourcesToLayerRequests", () => {
  it("maps each LayerSource to a LayerRequest, preserving order", () => {
    const sources: LayerSource[] = [
      { layerUuid: "uuid-preresolved", preResolvedFeatures: [makeFeature(1)] },
      { layerUuid: "uuid-identify", distribution: geoadminDistribution() },
      { layerUuid: "uuid-empty" },
    ];

    const requests = sourcesToLayerRequests(sources);

    expect(requests).toEqual([
      {
        layerUuid: "uuid-preresolved",
        layerId: "undefined",
        preResolvedFeatures: [makeFeature(1)],
      },
      { layerUuid: "uuid-identify", layerId: LAYER_ID, urlTemplate: TEMPLATE },
      { layerUuid: "uuid-empty", layerId: "undefined" },
    ]);
  });

  it("returns an empty array when given no sources", () => {
    expect(sourcesToLayerRequests([])).toEqual([]);
  });
});
