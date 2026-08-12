import type {
  GeoJSONLayer,
  GPXLayer,
  KMLLayer,
  KMZLayer,
  Layer,
  WMSLayer,
  WMTSLayer,
} from "@/types";

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
