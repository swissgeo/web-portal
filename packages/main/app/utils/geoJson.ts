import type { FeatureCollectionWithCRS } from "@swissgeo/map";

import GeoJSON from "ol/format/GeoJSON";

/**
 * Parses a GeoJSON string, returning `undefined` unless it is a FeatureCollection
 * OpenLayers can render.
 *
 * Plain JSON such as `{"title": "un JSON standard"}` parses without error but is
 * not GeoJSON, and would otherwise be handed to the renderer and fail silently.
 */
export function parseGeoJson(
  raw: string,
): FeatureCollectionWithCRS | undefined {
  let parsed: FeatureCollectionWithCRS;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  // OpenLayers also accepts a bare Feature or geometry, and skips a `features`
  // that isn't an array, so the collection shape is checked here.
  if (parsed?.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    return undefined;
  }

  try {
    // Validating with the parser that renders the data keeps the two from
    // disagreeing on what is acceptable.
    new GeoJSON().readFeatures(parsed);
  } catch {
    return undefined;
  }
  return parsed;
}
