import type { Extent } from "ol/extent";

import { constants } from "@swissgeo/coordinates";

import type {
  PrintFormat,
  PrintOrientation,
  PrintConfig,
} from "../types/print";

import { printFormats, printOrientations } from "../types/print";

const MM_PER_INCH = 25.4;
const METERS_PER_INCH = MM_PER_INCH / 1000;
const SQRT_2 = 2 ** 0.5;

// Length in millimeter of the short side of the page
const A0_SHORT_SIDE_MM = 841;
// Length in millimeter of the long side of the page
const A0_LONG_SIDE_MM = 1189;

// Ratios between A0 and the smaller Ax page size
const formatRatiosToA0: Record<PrintFormat, number> = {
  a3: SQRT_2 ** 3,
  a4: SQRT_2 ** 4,
  a5: SQRT_2 ** 5,
};

/**
 * Get the print page size in pixels from a given format (eg. 'a4'), an orientation (eg. 'landscape') and a resolution in DPI (eg. 192)
 */
export function getPageSizeInPixels(
  format: PrintFormat,
  orientation: PrintOrientation,
  resolutionDpi: number,
  round: boolean = true,
): { width: number; height: number } {
  let longSide = computeNumberOfPixelsForPrint(
    ~~(A0_LONG_SIDE_MM / formatRatiosToA0[format]),
    resolutionDpi,
  );
  let shortSide = computeNumberOfPixelsForPrint(
    ~~(A0_SHORT_SIDE_MM / formatRatiosToA0[format]),
    resolutionDpi,
  );

  if (round) {
    longSide = Math.round(longSide);
    shortSide = Math.round(shortSide);
  }

  return orientation === "landscape"
    ? { width: longSide, height: shortSide }
    : { width: shortSide, height: longSide };
}

/**
 * Get the size in pixel for a given size in millimeter and DPI resolution
 */
export function computeNumberOfPixelsForPrint(
  sizeMm: number,
  resolutionDpi: number,
): number {
  return (resolutionDpi * sizeMm) / MM_PER_INCH;
}

/**
 * Test if the provided element is an object
 */
export function isObject(val: unknown): boolean {
  return typeof val === "object" && !Array.isArray(val) && val !== null;
}

/**
 * Validates a print config
 */
export function validatePrintConfig(
  printProps: unknown,
): asserts printProps is PrintConfig {
  if (!isObject(printProps)) {
    throw new Error("The print config object must be an object");
  }

  const maybePrintProps = printProps as Partial<PrintConfig>;

  if (
    !maybePrintProps.format ||
    !printFormats.includes(maybePrintProps.format)
  ) {
    throw new Error(
      `The print format must be one of: ${printFormats.join(" ")}`,
    );
  }

  if (
    !maybePrintProps.orientation ||
    !printOrientations.includes(maybePrintProps.orientation)
  ) {
    throw new Error(
      `The print orientation must be one of: ${printOrientations.join(" ")}`,
    );
  }

  if (
    maybePrintProps.resolution === undefined ||
    maybePrintProps.resolution <= 0
  ) {
    throw new Error("The print resolution must be greater than 0");
  }

  if (maybePrintProps.scale !== undefined) {
    // The map cannot zoom beyond its resolutions, so a page waiting for a scale outside of them
    // would never be ready. Failing here says why.
    const { scale, resolution } = maybePrintProps;
    const { LV95_RESOLUTIONS } = constants;
    const minScale = Math.ceil(
      getScaleForResolution(Math.min(...LV95_RESOLUTIONS), resolution),
    );
    const maxScale = Math.floor(
      getScaleForResolution(Math.max(...LV95_RESOLUTIONS), resolution),
    );
    if (!(scale >= minScale && scale <= maxScale)) {
      throw new Error(
        `The print scale must be between 1:${minScale} and 1:${maxScale}, the scales the map can show`,
      );
    }
  }
}

/**
 * Map resolution (m/px) at which a page printed at the given DPI has the given scale,
 * e.g. 1:25'000 is 250 m per cm on paper. Inverse of {@link getScaleForResolution}.
 */
export function getResolutionForScale(
  scale: number,
  resolutionDpi: number,
): number {
  return (scale * METERS_PER_INCH) / resolutionDpi;
}

/**
 * The scale of the list closest to the given one. Scales are compared by ratio,
 * so 1:20'000 is closer to 1:25'000 than to 1:10'000.
 */
export function getClosestScale(
  scale: number,
  scales: readonly number[],
): number {
  return scales.reduce((closest, candidate) =>
    Math.abs(Math.log(candidate / scale)) < Math.abs(Math.log(closest / scale))
      ? candidate
      : closest,
  );
}

/**
 * Scale denominator (25'000 for 1:25'000) of a page printed at the given DPI when the map is at
 * the given resolution (m/px). At 96 dpi this is the column "Approx. scale at 96 dpi per zoom level"
 * of https://docs.geo.admin.ch/visualize-data/wmts.html#gettile (2.5 m/px is 1:9'449).
 */
export function getScaleForResolution(
  resolution: number,
  resolutionDpi: number,
): number {
  return (resolution * resolutionDpi) / METERS_PER_INCH;
}

/**
 * Extent (in map units) of a page of widthPx x heightPx pixels drawn at the given resolution
 */
export function getPrintExtentForResolution(
  resolution: number,
  widthPx: number,
  heightPx: number,
  mapCenter: [number, number],
): Extent {
  const halfWidth = (widthPx * resolution) / 2;
  const halfHeight = (heightPx * resolution) / 2;

  return [
    mapCenter[0] - halfWidth,
    mapCenter[1] - halfHeight,
    mapCenter[0] + halfWidth,
    mapCenter[1] + halfHeight,
  ];
}
