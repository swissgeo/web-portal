// Coordinate search: recognizes a coordinate typed in the search bar

import {
  constants,
  coordinateFromString,
  coordinatesUtils,
  LV95,
} from "@swissgeo/coordinates";

import type { CoordinateSearchResult } from "@/types/search";

/**
 * Coordinates are precise, so we zoom on a 1:25'000 map when going there, as map.geo.admin.ch does
 */
const COORDINATE_ZOOM = constants.SWISS_ZOOM_LEVEL_1_25000_MAP;

/**
 * Tells if the given query is a coordinate, and if so builds the matching search result.
 *
 * Coordinates outside of the LV95 bounds are ignored, as there is nothing to show there.
 *
 * @param queryString - Search query text
 * @returns The coordinate search result, or undefined if the query is not a coordinate
 */
export function searchCoordinate(
  queryString: string,
): CoordinateSearchResult | undefined {
  const extracted = coordinateFromString(queryString);
  if (!extracted) {
    return;
  }

  const coordinate = coordinatesUtils.reprojectAndRound(
    extracted.coordinateSystem,
    LV95,
    extracted.coordinate,
  );
  if (!LV95.isInBounds(coordinate)) {
    return;
  }

  const lv95Title = coordinatesUtils.toRoundedString(coordinate, 2, true, true);
  if (!lv95Title) {
    return;
  }
  // when the user typed something else than LV95, we tell in which system it was understood
  const title =
    extracted.coordinateSystem.epsg === LV95.epsg
      ? lv95Title
      : `${lv95Title} (${extracted.coordinateSystem.label})`;

  return {
    resultType: "COORDINATE",
    id: `coordinate-${coordinate.join(",")}`,
    title,
    sanitizedTitle: title,
    description: extracted.coordinateSystem.label,
    coordinate,
    zoom: COORDINATE_ZOOM,
  };
}
