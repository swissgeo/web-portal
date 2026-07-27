import type { Geometry, Feature as geojsonFeature } from "geojson";
export interface FeatureData {
  featureId: string;
  geometry: Geometry; // for @swissgeo/map's :highlighted-features
  content:
    | { kind: "html"; html: string; trusted: boolean }
    | { kind: "json"; properties: Record<string, unknown> };
}

export interface LayerRequest {
  layerUuid: string;

  // strategy should be found within the data, and ideally self resolve without any input from us.
  strategy?: string;
  urlTemplate?: string;
  preResolvedFeatures?: geojsonFeature[];
}
