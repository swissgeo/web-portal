import type { FeatureCollectionWithCRS } from "@swissgeo/map";

/**
 * Parses a GeoJSON string, returning `undefined` unless it is a valid
 * FeatureCollection.
 *
 * Plain JSON such as `{"title": "un JSON standard"}` parses without error but is
 * not GeoJSON, and would otherwise be handed to the renderer and fail silently.
 */
export function parseGeoJson(
  raw: string,
): FeatureCollectionWithCRS | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  const collection = parsed as FeatureCollectionWithCRS;
  if (
    typeof collection !== "object" ||
    collection === null ||
    collection.type !== "FeatureCollection" ||
    !Array.isArray(collection.features) ||
    !collection.features.every((feature) => feature?.type === "Feature")
  ) {
    return undefined;
  }
  return collection;
}
