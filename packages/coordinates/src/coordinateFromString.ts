import type { SingleCoordinate } from "@/coordinatesUtils";
import type CoordinateSystem from "@/proj/CoordinateSystem";

import { toPoint, utmToLonLat } from "@/militaryGridProjection";
import { LV03, LV95, WEBMERCATOR, WGS84 } from "@/proj";

/** A coordinate extracted from a user input, expressed in the system it was recognized as */
export interface ExtractedCoordinate {
  coordinate: SingleCoordinate;
  coordinateSystem: CoordinateSystem;
}

/** What people use as thousand separator, e.g. in "2'600'000" */
const THOUSAND_SEPARATOR = String.raw`['’\`´ ]`;
/** What separates the two values of a pair */
const SEPARATOR = String.raw`\s*[ \t,;/]\s*`;
/** A number, optionally using a thousand separator */
const NUMBER = String.raw`-?\d{1,3}(?:${THOUSAND_SEPARATOR}\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?`;
/** Two numbers, separated by a comma, a semicolon, a slash or a whitespace */
const NUMBER_PAIR = new RegExp(
  String.raw`^(${NUMBER})${SEPARATOR}(${NUMBER})$`,
);
/** Two numbers using a comma as decimal separator, e.g. "46,95 7,44" */
const COMMA_DECIMALS = new RegExp(
  String.raw`^(-?[\d'’\`´ ]+,\d+)[;/\s]+(-?[\d'’\`´ ]+,\d+)$`,
);

const DEGREE_SYMBOL = String.raw`\s*°\s*`;
const MINUTE_SYMBOL = String.raw`\s*['‘’‛′]\s*`;
const SECOND_SYMBOL = String.raw`\s*(?:["“”‟″]|['‘’‛′]{2})\s*`;
const DEGREES = String.raw`\d{1,3}(?:[.,]\d+)?`;
const MINUTES_OR_SECONDS = String.raw`\d{1,2}(?:[.,]\d+)?`;
const CARDINAL = `[NSEW]`;

/**
 * One value of a pair, in degrees, degrees/minutes or degrees/minutes/seconds. As soon as there are
 * minutes the symbols become optional, which is how Google writes them: "46 58.79" for "46° 58.79'".
 */
function degreesPattern(index: 1 | 2, precision: 1 | 2 | 3): string {
  const degrees = String.raw`(?<deg${index}>${DEGREES})`;
  if (precision === 1) {
    return `${degrees}${DEGREE_SYMBOL}`;
  }
  const minutes = String.raw`${degrees}(?:${DEGREE_SYMBOL}|\s+)(?<min${index}>${MINUTES_OR_SECONDS})`;
  if (precision === 2) {
    return `${minutes}(?:${MINUTE_SYMBOL})?`;
  }
  return String.raw`${minutes}(?:${MINUTE_SYMBOL}|\s+)(?<sec${index}>${MINUTES_OR_SECONDS})(?:${SECOND_SYMBOL})?`;
}

function degreesRegex(precision: 1 | 2 | 3, cardinalFirst: boolean): RegExp {
  const value = (index: 1 | 2) =>
    cardinalFirst
      ? String.raw`(?<card${index}>${CARDINAL})\s*${degreesPattern(index, precision)}`
      : String.raw`${degreesPattern(index, precision)}\s*(?<card${index}>${CARDINAL})?`;
  return new RegExp(`^${value(1)}${SEPARATOR}${value(2)}$`, "i");
}

/**
 * Every notation of a WGS84 pair we accept, the most precise first so that the minutes of
 * "46 58.79 6 36.45" are not read as a second pair of degrees.
 */
const DEGREES_REGEXES = ([3, 2, 1] as const).flatMap((precision) => [
  degreesRegex(precision, false),
  degreesRegex(precision, true),
]);
/** UTM coordinates, with the zone either in front or behind, e.g. "32T 425215 5087009" */
const UTM_REGEX =
  /^(?:(\d{1,2})\s*([C-HJ-NP-X])[\s,;/]*)?(\d+(?:\.\d+)?)\s*(?:[,;/]|\s)\s*(\d+(?:\.\d+)?)(?:[\s,;/]*\(?\s*(\d{1,2})\s*([C-HJ-NP-X])\s*\)?)?$/i;
/** MGRS coordinates, without any whitespace, e.g. "32TMT5515105105" */
const MGRS_REGEX = /^\d{1,2}[C-HJ-NP-X][A-HJ-NP-Z]{2}(?:\d\d)*$/i;

const MAX_LONGITUDE = 180;

function removeThousandSeparators(text: string): string {
  return text.replace(
    new RegExp(String.raw`${THOUSAND_SEPARATOR}(?=\d{3}\b)`, "g"),
    "",
  );
}

function toNumber(value: string = "0"): number {
  return parseFloat(value.replace(",", "."));
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

function extractDegrees(text: string): ExtractedCoordinate | undefined {
  const groups = DEGREES_REGEXES.map((regex) => regex.exec(text)).find(
    Boolean,
  )?.groups;
  if (!groups) {
    return;
  }

  const values = ([1, 2] as const).map(
    (index) =>
      toNumber(groups[`deg${index}`]) +
      toNumber(groups[`min${index}`]) / 60 +
      toNumber(groups[`sec${index}`]) / 3600,
  );
  const cardinals = ([1, 2] as const).map((index) =>
    groups[`card${index}`]?.toUpperCase(),
  );
  const signed = values.map((value, index) =>
    cardinals[index] === "S" || cardinals[index] === "W" ? -value : value,
  );
  // the first value is a latitude, unless the hemispheres say otherwise
  const latitudeFirst = !["E", "W"].includes(cardinals[0] ?? "");
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
 * Recognized are LV95, LV03 and WebMercator pairs, WGS84 in decimal, degrees/minutes or
 * degrees/minutes/seconds notation (with or without the °'" symbols), UTM and MGRS. UTM and MGRS
 * coordinates are returned in WGS84.
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
    extractDegrees(trimmed) ??
    extractUTM(trimmed) ??
    extractNumberPair(trimmed)
  );
}
