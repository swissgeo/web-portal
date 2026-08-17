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
): OgcDistribution {
  return {
    type: "FeatureCollection",
    features: features.map((entry) => ({
      id: `distribution-${entry.protocol}`,
      links: [] as Array<{ href: string; rel: string }>,
      linkTemplates: entry.linkTemplates,
      properties: { type: "distribution", protocol: entry.protocol },
    })),
  } as unknown as OgcDistribution;
}

const geoadminDistribution = (): OgcDistribution =>
  makeDistribution([
    {
      protocol: "geoadmin:features",
      linkTemplates: [{ rel: "preview", uriTemplate: TEMPLATE }],
    },
  ]);

function makeGeoadminSource(
  overrides: Partial<Extract<LayerSource, { kind: "geoadmin" }>> = {},
): LayerSource {
  return {
    kind: "geoadmin",
    layerUuid: UUID,
    layerId: LAYER_ID,
    ...overrides,
  };
}

describe("sourceToLayerRequest", () => {
  describe("handling sources with pre-existing features", () => {
    it("returns a pre-resolved request when preResolvedFeatures is non-empty, even if a geoadmin:features distribution is present", () => {
      const features = [makeFeature(1), makeFeature(2)];

      const request = sourceToLayerRequest(
        makeGeoadminSource({
          distribution: geoadminDistribution(),
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
  });

  describe("handling sources with a geoadmin:features distribution", () => {
    it("extracts the preview uriTemplate as urlTemplate", () => {
      const request = sourceToLayerRequest(
        makeGeoadminSource({ distribution: geoadminDistribution() }),
      );

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

      const request = sourceToLayerRequest(
        makeGeoadminSource({ distribution }),
      );

      expect(request.urlTemplate).toBe(TEMPLATE);
    });

    it("ignores ogc:wmts and ogc:wms distributions", () => {
      const distribution = makeDistribution([
        { protocol: "ogc:wmts" },
        { protocol: "ogc:wms" },
      ]);

      const request = sourceToLayerRequest(
        makeGeoadminSource({ distribution }),
      );

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });

    it("falls back to the distribution when preResolvedFeatures is an empty array", () => {
      const request = sourceToLayerRequest(
        makeGeoadminSource({
          distribution: geoadminDistribution(),
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

  describe("handling sources with no usable data", () => {
    it("returns an empty request for a geoadmin source without distribution nor features", () => {
      const request = sourceToLayerRequest(makeGeoadminSource());

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });

    it("returns an empty request for an external WMS source (getFeatureInfo not implemented yet)", () => {
      const request = sourceToLayerRequest({
        kind: "externalWms",
        layerUuid: UUID,
        layerId: LAYER_ID,
        getFeatureInfoCapability: {
          baseUrl: "https://example.test/wms",
          method: "GET",
          formats: ["application/json"],
        },
      });

      expect(request).toEqual({ layerUuid: UUID, layerId: LAYER_ID });
    });
  });
});

describe("sourcesToLayerRequests", () => {
  it("maps each LayerSource to a LayerRequest, preserving order", () => {
    const sources: LayerSource[] = [
      makeGeoadminSource({
        layerUuid: "uuid-preresolved",
        preResolvedFeatures: [makeFeature(1)],
      }),
      makeGeoadminSource({
        layerUuid: "uuid-identify",
        distribution: geoadminDistribution(),
      }),
      makeGeoadminSource({ layerUuid: "uuid-empty" }),
    ];

    const requests = sourcesToLayerRequests(sources);

    expect(requests).toEqual([
      {
        layerUuid: "uuid-preresolved",
        layerId: LAYER_ID,
        preResolvedFeatures: [makeFeature(1)],
      },
      { layerUuid: "uuid-identify", layerId: LAYER_ID, urlTemplate: TEMPLATE },
      { layerUuid: "uuid-empty", layerId: LAYER_ID },
    ]);
  });

  it("returns an empty array when given no sources", () => {
    expect(sourcesToLayerRequests([])).toEqual([]);
  });
});
