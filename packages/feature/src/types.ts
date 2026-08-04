import type {
  Geometry,
  GeometryCollection,
  Feature as geojsonFeature,
} from "geojson";
export interface FeatureData {
  featureId: string;
  geometry: Exclude<Geometry, GeometryCollection>;
  content:
    | { kind: "html"; html: string; trusted: boolean }
    | { kind: "json"; properties: Record<string, unknown> };
}

export interface LayerRequest {
  layerUuid: string;
  layerId: string;

  // strategy should be found within the data, and ideally self resolve without any input from us.
  urlTemplate?: string;
  preResolvedFeatures?: geojsonFeature[];
}

export interface LayerSource {
  layerUuid: string;
  distribution?: OgcDistribution;
  preResolvedFeatures?: geojsonFeature[];
}

export interface OgcDistribution {
  id: string;
  type: "FeatureCollection";
  features: OgcDistributionFeature[];
}

interface OgcDistributionFeature extends GeoJSON.Feature {
  linkTemplates?: OgcLinkTemplate[];
}

interface OgcLinkTemplate {
  rel?: string;
  uriTemplate?: string;
  type?: string;
  title?: string;
}
