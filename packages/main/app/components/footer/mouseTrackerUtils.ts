import type { SingleCoordinate, CoordinateSystem } from "@swissgeo/coordinates";
import type { CoordinateFormat } from "@swissgeo/map";

import { LV03 } from "@swissgeo/coordinates";
import { LV03Format, LV95Format } from "@swissgeo/map";
import proj4 from "proj4";

function isNumber(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    !Number.isNaN(Number(value)) &&
    (typeof value !== "string" || value.length !== 0)
  );
}

function round(value: number, decimals: number = 0): number {
  if (!isNumber(value)) {
    return Number.NaN;
  }
  if (decimals === 0) {
    return Math.round(value);
  }
  const pow = Math.pow(10, decimals);
  return Math.round(value * pow) / pow;
}

export interface HumanReadableCoordinateParams {
  coordinates: SingleCoordinate;
  projection: CoordinateSystem;
  displayedFormat: CoordinateFormat;
}

export function getHumanReadableCoordinate({
  coordinates,
  projection,
  displayedFormat,
}: HumanReadableCoordinateParams): string {
  let coordsToFormat: SingleCoordinate = coordinates;

  if (displayedFormat.id === LV95Format.id) {
    coordsToFormat = coordinates;
  } else if (displayedFormat.id === LV03Format.id) {
    coordsToFormat =
      projection.epsg === LV03.epsg
        ? coordinates
        : (proj4(projection.epsg, LV03.epsg, coordinates) as SingleCoordinate);
  } else {
    if (projection.epsg !== displayedFormat.requiredInputProjection.epsg) {
      coordsToFormat = proj4(
        projection.epsg,
        displayedFormat.requiredInputProjection.epsg,
        coordinates,
      ) as SingleCoordinate;
    }
  }

  if (displayedFormat.id === LV95Format.id) {
    return `${displayedFormat.formatCallback(coordsToFormat, false)}`;
  } else if (displayedFormat.id === LV03Format.id) {
    return `~ ${displayedFormat.formatCallback(
      coordsToFormat.map((value) => round(value)) as SingleCoordinate,
      false,
    )}`;
  }
  return displayedFormat.formatCallback(coordsToFormat, true);
}
