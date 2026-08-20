import type { SingleCoordinate } from "@/coordinatesUtils";
import type CoordinateSystem from "@/proj/CoordinateSystem";

import { toPoint, utmToLonLat } from "@/militaryGridProjection";
import { LV03, LV95, WEBMERCATOR, WGS84 } from "@/proj";

/** A coordinate extracted from a user input, expressed in the system it was recognized as */
export interface ExtractedCoordinate {
  coordinate: SingleCoordinate;
  coordinateSystem: CoordinateSystem;
}

/** A number, optionally using an apostrophe or a space as thousand separator */
const NUMBER = String.raw`-?\d{1,3}(?:['’ ]\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?`;
/** Two numbers, separated by a comma, a semicolon, a slash or a whitespace */
const NUMBER_PAIR = new RegExp(
  String.raw`^(${NUMBER})\s*(?:[,;/]|\s)\s*(${NUMBER})$`,
);
/** Two numbers using a comma as decimal separator, e.g. "46,95 7,44" */
const COMMA_DECIMALS = /^(-?[\d'’ ]+,\d+)[;/\s]+(-?[\d'’ ]+,\d+)$/;
/**
 * A degree/minute/second value, with the hemisphere either in front or behind, e.g. "47° 22' 12.5"
 * N". Minutes and seconds are optional, so "47.5°N" is matched too.
 */
const DMS_PART = new RegExp(
  String.raw`([NSEW])?\s*(\d+(?:\.\d+)?)\s*°\s*(?:(\d+(?:\.\d+)?)\s*['′’]\s*)?(?:(\d+(?:\.\d+)?)\s*(?:["″”]|''|′′)\s*)?([NSEW])?`,
  "gi",
);
/** UTM coordinates, with the zone either in front or behind, e.g. "32T 425215 5087009" */
const UTM_REGEX =
  /^(?:(\d{1,2})\s*([C-HJ-NP-X])[\s,;/]*)?(\d+(?:\.\d+)?)\s*(?:[,;/]|\s)\s*(\d+(?:\.\d+)?)(?:[\s,;/]*\(?\s*(\d{1,2})\s*([C-HJ-NP-X])\s*\)?)?$/i;
/** MGRS coordinates, without any whitespace, e.g. "32TMT5515105105" */
const MGRS_REGEX = /^\d{1,2}[C-HJ-NP-X][A-HJ-NP-Z]{2}(?:\d\d)*$/i;

const MAX_LONGITUDE = 180;

function removeThousandSeparators(text: string): string {
  return text.replace(/['’ ](?=\d{3}\b)/g, "");
}

function toDecimalDegrees(
  degrees: string,
  minutes?: string,
  seconds?: string,
): number {
  return (
    parseFloat(degrees) +
    parseFloat(minutes ?? "0") / 60 +
    parseFloat(seconds ?? "0") / 3600
  );
}

/**
 * Recognizes a pair of numbers, deciding which coordinate system it belongs to through the bounds of
 * each system. Both axis orders are tested, so that "1200000 2600000" is understood as LV95 too.
 */
function extractNumberPair(text: string): ExtractedCoordinate | undefined {
  let match = NUMBER_PAIR.exec(text);
  if (!match) {
    const commaDecimals = COMMA_DECIMALS.exec(text);
    if (!commaDecimals) {
      return;
    }
    match = NUMBER_PAIR.exec(
      `${commaDecimals[1].replace(",", ".")} ${commaDecimals[2].replace(",", ".")}`,
    );
    if (!match) {
      return;
    }
  }

  const first = parseFloat(removeThousandSeparators(match[1]));
  const second = parseFloat(removeThousandSeparators(match[2]));

  // small values can only be WGS84, and are expected in the "lat, lon" order swisstopo displays
  if (Math.abs(first) <= MAX_LONGITUDE && Math.abs(second) <= MAX_LONGITUDE) {
    if (WGS84.isInBounds(second, first)) {
      return { coordinate: [second, first], coordinateSystem: WGS84 };
    }
    if (WGS84.isInBounds(first, second)) {
      return { coordinate: [first, second], coordinateSystem: WGS84 };
    }
    return;
  }

  for (const coordinateSystem of [LV95, LV03, WEBMERCATOR]) {
    if (coordinateSystem.isInBounds(first, second)) {
      return { coordinate: [first, second], coordinateSystem };
    }
    if (coordinateSystem.isInBounds(second, first)) {
      return { coordinate: [second, first], coordinateSystem };
    }
  }
}

function extractDegreesMinutesSeconds(
  text: string,
): ExtractedCoordinate | undefined {
  const parts = [...text.matchAll(DMS_PART)].map((match) => ({
    value: toDecimalDegrees(match[2], match[3], match[4]),
    hemisphere: (match[1] ?? match[5])?.toUpperCase(),
  }));
  if (parts.length !== 2) {
    return;
  }

  const signed = parts.map(({ value, hemisphere }) =>
    hemisphere === "S" || hemisphere === "W" ? -value : value,
  );
  // the first value is a latitude, unless the hemispheres say otherwise
  const latitudeFirst = !["E", "W"].includes(parts[0].hemisphere ?? "");
  const coordinate: SingleCoordinate = latitudeFirst
    ? [signed[1], signed[0]]
    : [signed[0], signed[1]];

  if (!WGS84.isInBounds(coordinate)) {
    return;
  }
  return { coordinate, coordinateSystem: WGS84 };
}

function extractUTM(text: string): ExtractedCoordinate | undefined {
  const match = UTM_REGEX.exec(text.replace(/['’]/g, ""));
  const zoneNumber = match?.[1] ?? match?.[5];
  const zoneLetter = match?.[2] ?? match?.[6];
  if (!match || !zoneNumber || !zoneLetter) {
    return;
  }

  try {
    return {
      coordinate: utmToLonLat({
        easting: parseFloat(match[3]),
        northing: parseFloat(match[4]),
        zoneNumber: parseInt(zoneNumber, 10),
        zoneLetter: zoneLetter.toUpperCase(),
      }),
      coordinateSystem: WGS84,
    };
  } catch {
    return;
  }
}

function extractMGRS(text: string): ExtractedCoordinate | undefined {
  const mgrs = text.replace(/\s/g, "").toUpperCase();
  if (!MGRS_REGEX.test(mgrs)) {
    return;
  }

  try {
    return { coordinate: toPoint(mgrs), coordinateSystem: WGS84 };
  } catch {
    return;
  }
}

/**
 * Extracts a coordinate out of a user input, e.g. what was typed in the search bar.
 *
 * Recognized are LV95, LV03 and WebMercator pairs, WGS84 in decimal or degrees/minutes/seconds
 * notation, UTM and MGRS. UTM and MGRS coordinates are returned in WGS84.
 *
 * @param text The user input
 * @returns The coordinate and the system it is expressed in, or undefined if nothing was recognized
 */
export function coordinateFromString(
  text: string,
): ExtractedCoordinate | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }
  return (
    extractMGRS(trimmed) ??
    extractDegreesMinutesSeconds(trimmed) ??
    extractUTM(trimmed) ??
    extractNumberPair(trimmed)
  );
}
