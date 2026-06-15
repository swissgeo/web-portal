import { isTimestampYYYYMMDD } from "@swissgeo/numbers";

// Time constants
/**
 * "Timestamp" to describe "Every" period in which the data is available, and the intention to show them all at the same time (for example: accidents).
 */
export const ALL_YEARS_TIMESTAMP: string = "all";

/**
 * Timestamp to describe "current" or latest available data for a time enabled WMTS layer (and also
 * is the default value to give any WMTS layer that is not time enabled, as this timestamp is
 * required in the URL scheme)
 */
export const CURRENT_YEAR_TIMESTAMP: string = "current";

/**
 * Extracts the year (as a 4-character string) from a geoadmin timestamp value.
 * Handles formats: 'YYYY', 'YYYYMMDD', 'YYYY-MM-DD', ISO 8601, etc.
 * Returns undefined if the timestamp cannot be parsed.
 */
export function getYearFromGeoadminValue(
  timestamp: string,
): string | undefined {
  if (timestamp.match(/^\d{4}$/)) {
    return timestamp;
  }

  if (isTimestampYYYYMMDD(timestamp)) {
    return timestamp.substring(0, 4);
  }

  const date = new Date(timestamp);
  if (!isNaN(date.getFullYear())) {
    const parsedYear = date.getFullYear().toString().padStart(4, "0");
    if (parsedYear) {
      return parsedYear;
    }
  }

  return undefined;
}

/**
 * Converts a year (number) back to the matching raw timestamp string from a list of available values.
 * Returns undefined if no matching timestamp is found.
 */
export function convertYearToTimestamp(
  availableValues: string[],
  year: number,
): string | undefined {
  if (availableValues.includes(year.toString())) {
    return year.toString();
  }

  for (const timestamp of availableValues) {
    const valueInYear = getYearFromGeoadminValue(timestamp);
    if (year.toString() === valueInYear) {
      return timestamp;
    }
  }
  return undefined;
}

export function getDisplayNameFromTimestamp(
  timestamp: string | null | undefined,
) {
  if (timestamp === null || timestamp === undefined) {
    return "-";
  } else if (timestamp === "current") {
    return "current";
  } else if (
    timestamp.startsWith("9999") ||
    timestamp === ALL_YEARS_TIMESTAMP
  ) {
    // there's a difference between WMS and WMTS:
    // WMS will store 'all' as timestamp. If 'all' is set, then it won't give the
    // server a time
    // However on wmts we'll specifically select the timestamp that represents
    // all in the requests
    return ALL_YEARS_TIMESTAMP;
  } else {
    const parsedYear = getYearFromGeoadminValue(timestamp);
    if (parsedYear) {
      return parseInt(parsedYear);
    }
  }

  return "unknown";
}
