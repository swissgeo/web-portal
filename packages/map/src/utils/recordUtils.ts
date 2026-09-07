import {
  type GeoJSONLayer,
  type GPXLayer,
  type HighLightLayer,
  type KMLLayer,
  type KMZLayer,
  type Layer,
  type WMSLayer,
  type WMTSLayer,
} from "@/types";
import { HIGHLIGHT_LAYER_ID } from "@swissgeo/shared";

// maybe this belongs to shared?

export const isWMTS = (layer: Layer): layer is WMTSLayer =>
  layer.format?.toUpperCase() === "WMTS";
export const isWMS = (layer: Layer): layer is WMSLayer =>
  layer.format?.toUpperCase() === "WMS";
export const isKML = (layer: Layer): layer is KMLLayer =>
  layer.format?.toUpperCase() === "KML";
export const isKMZ = (layer: Layer): layer is KMZLayer =>
  layer.format?.toUpperCase() === "KMZ";
export const isGPX = (layer: Layer): layer is GPXLayer =>
  layer.format?.toUpperCase() === "GPX";
export const isGeoJSON = (layer: Layer): layer is GeoJSONLayer =>
  layer.format?.toUpperCase() === "GEOJSON";
export const isHighlightedLayer = (layer: Layer): layer is HighLightLayer =>
  layer?.format.toUpperCase() === "GEOJSON" &&
  layer.isSystemLayer &&
  layer.uuid === HIGHLIGHT_LAYER_ID;
