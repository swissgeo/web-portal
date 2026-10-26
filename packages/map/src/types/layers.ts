import type { Options as WMTSOptions } from "ol/source/WMTS";
import type { Component } from "vue";

import type { FeatureCollectionWithCRS } from "@/utils/geoJsonUtils";
import type { ShapeIconSpec } from "@/utils/maplibreShapeIcons";

export type { ShapeIconSpec };
import type { HIGHLIGHT_LAYER_ID } from "@swissgeo/shared";

/**
 * Minimal structural type for a hosted MapLibre style document.
 * The viewer only consumes these fields;
 * everything else passes through to `ol-mapbox-style`
 * */
export interface MapLibreStyleLayer {
  id: string;
  type: string;
  source?: string;
  metadata?: unknown;
  layout?: unknown;
  paint?: unknown;
  filter?: unknown;
  minzoom?: number;
  maxzoom?: number;
}

export interface MapLibreStyleDocument {
  version: 8;
  name?: string;
  metadata?: unknown;
  sources: { [sourceId: string]: unknown };
  layers: MapLibreStyleLayer[];
}

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

export type LayerFormat =
  | "WMTS"
  | "WMS"
  | "GeoJSON"
  | "KML"
  | "KMZ"
  | "GPX"
  | "COG";

export interface Layer {
  format: LayerFormat;
  layerId: string;
  uuid: string;
  opacity: number;
  isVisible: boolean;
  zIndex?: number;
  displayName?: string;
  isSystemLayer?: boolean;
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
  data: Uint8Array;
}

export interface GPXLayer extends Layer {
  format: "GPX";
  data: string;
}

export interface GeoJSONLayer extends Layer {
  format: "GeoJSON";
  geoJsonData: FeatureCollectionWithCRS;
  mapLibreStyle?: MapLibreStyleDocument;
  mapLibreIcons?: ShapeIconSpec[];
}

export interface COGLayer extends Layer {
  format: "COG";
  url?: string;
  blob?: Blob;
}
export interface HighLightLayer extends GeoJSONLayer {
  uuid: typeof HIGHLIGHT_LAYER_ID;
  isSystemLayer: true;
}

export interface MapLayerRenderer {
  matches: (layer: Layer) => boolean;
  component: Component;
}
