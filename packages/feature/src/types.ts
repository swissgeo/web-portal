import type {
  Geometry,
  GeometryCollection,
  Feature as geojsonFeature,
} from "geojson";

export interface FeatureData {
  featureId: string;
  /**
   * There is a probability that a feature, once fetched, doesn't return a geometry.
   * This would most likely mean there is an issue with the data.
   */
  geometry: Exclude<Geometry, GeometryCollection> | null;
  content:
    | { kind: "html"; html: string; trusted: boolean }
    | { kind: "json"; properties: Record<string, unknown> };
}

export interface LayerRequest {
  layerUuid: string;
  layerId: string;

  // priority 1: already existing features
  preResolvedFeatures?: geojsonFeature[];

  // priority 2: identify is present
  urlTemplate?: string;
}

// priority 3: wms feature info available
export interface WMSLayerRequest extends LayerRequest {
  wmsGetFeatureInfo: {
    baseUrl: string;
    method: "GET" | "POST";
    formats: string[];
  };
  wmsVersion?: string;
  availableCrs: string[];
}

/**
 * For a given WMS layer, the information needed to run a GetFeatureInfo
 * query on the server. queryable is not present, as it is used to decide wether or
 * not those information are stored or not (basically, non queryable layers have
 * no existence within the feature store.)
 */
export interface WmsFeatureInfoCapability {
  getFeatureInfoCapability: {
    baseUrl: string;
    method: "GET" | "POST";
    formats: string[];
  };
  wmsVersion?: string;
  availableCrs: string[];
}

export interface OgcDistribution {
  type: "FeatureCollection";
  features: OgcDistributionFeature[];
  links?: OgcLink[];
}

export type LayerSource = {
  layerUuid: string;
  layerId: string;
};
export interface GeoAdminSource extends LayerSource {
  kind: "geoadmin";
  distribution?: OgcDistribution;
  preResolvedFeatures?: geojsonFeature[];
}

export const isGeoAdminSource = (
  layerSource: LayerSource,
): layerSource is GeoAdminSource =>
  (layerSource as GeoAdminSource).kind === "geoadmin";

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
