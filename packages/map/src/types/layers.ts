import type { Options as WMTSOptions } from "ol/source/WMTS";
import type { Component } from "vue";

import type { MapLibreStyle } from "@/utils/geoadminToMapLibreStyle";
import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";
import type { FeatureCollectionWithCRS } from "@/utils/geoJsonUtils";
import type { ShapeIconSpec } from "@/utils/maplibreShapeIcons";

/**
 * At the moment, these 3 types are sort of like a duplicate of layers.
 * Maybe we'll figure out a way to share these types, but maybe it also makes
 * sense that each package defines it's type expecations encapsulated
 */
export interface Dimension {
  currentValue: string | null;
  availableValues: string[];
}

export type DimensionId = "time";

export type DimensionRecord = Partial<Record<DimensionId, Dimension>>;

export type LayerFormat = "WMTS" | "WMS" | "GeoJSON" | "KML" | "KMZ" | "GPX";

export interface Layer {
  format: LayerFormat;
  layerId: string;
  uuid: string;
  opacity: number;
  isVisible: boolean;
  zIndex?: number;
  displayName?: string;
}

export interface WMTSLayer extends Layer {
  format: "WMTS";
  options: WMTSOptions;
  dimensions: DimensionRecord;
}

export interface WMSLayer extends Layer {
  format: "WMS";
  dimensions: DimensionRecord;
  gutter: number;
  url: string;
  version: string;
  lang: string;
}

export interface KMLLayer extends Layer {
  format: "KML";
  data: string;
}

export interface KMZLayer extends Layer {
  format: "KMZ";
  data: string;
}

export interface GPXLayer extends Layer {
  format: "GPX";
  data: string;
}

export interface GeoJSONLayer extends Layer {
  format: "GeoJSON";
  geoJsonData: FeatureCollectionWithCRS;
  /** Legacy geoadmin "literals" style, rendered by `OlStyleForPropertyValue`. */
  geoJsonStyle?: GeoAdminGeoJSONStyleDefinition;
  /**
   * Standard MapLibre / mapbox-gl style, rendered via `ol-mapbox-style`. When set,
   * it takes precedence over `geoJsonStyle`. The companion `mapLibreIcons` supply
   * the generated icons for non-circle point shapes.
   */
  mapLibreStyle?: MapLibreStyle;
  mapLibreIcons?: ShapeIconSpec[];
}

export interface MapLayerRenderer {
  matches: (layer: Layer) => boolean;
  component: Component;
}
