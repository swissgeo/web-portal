// This file contains types used for the feature Info functionality.

import type { FlatExtent } from "@swissgeo/shared";
import type { Feature as GeoJSONFeature } from "geojson";

export type MapClickEvent = {
  coordinate: [number, number]; // exact click point.
  pixel: [number, number];
  extent: FlatExtent; // ← NEW: 10px box, computed by the map
  viewportSize: [number, number];
  vectorFeaturesPerLayer: Record<string, GeoJSONFeature[]>; // key = layer uuid
};
export type HighlightedFeature = GeoJSON.Feature;
