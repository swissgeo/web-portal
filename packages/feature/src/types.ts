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

  urlTemplate?: string;
  preResolvedFeatures?: geojsonFeature[];
}

export type LayerSource = GeoAdminSource | ExternalWMSSource;

export interface OgcDistribution {
  type: "FeatureCollection";
  features: OgcDistributionFeature[];
  links?: OgcLink[];
}

export interface GeoAdminSource {
  kind: "geoadmin";
  layerUuid: string;
  layerId: string;
  distribution?: OgcDistribution;
  preResolvedFeatures?: geojsonFeature[];
}
export interface ExternalWMSSource {
  kind: "externalWms";
  layerUuid: string;
  layerId: string;
  getFeatureInfoCapability: {
    baseUrl: string;
    method: "GET" | "POST";
    formats: string[];
  };
  wmsVersion?: string;
}
interface OgcDistributionFeature {
  id: string;
  links?: OgcLink[];
  linkTemplates?: OgcLinkTemplate[];
  properties: { type: string; protocol?: string; [k: string]: unknown };
}

export interface OgcLinkVariable {
  type: string;
  description: string;
  format?: string;
  default?: string | number;
  enum?: (string | number)[];
}
interface OgcLinkTemplate {
  rel?: string;
  uriTemplate?: string;
  type?: string;
  title?: string;
  variables?: Record<string, OgcLinkVariable>;
}

export interface OgcLink {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}
