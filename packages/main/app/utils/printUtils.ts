import type { Map as OlMapType } from "ol";
import type { Extent } from "ol/extent";

import type {
  PrintFormat,
  PrintOrientation,
  PrintConfig,
} from "../types/print";

import { printFormats, printOrientations } from "../types/print";

const MM_PER_INCH = 25.4;
const SQRT_2 = 2 ** 0.5;

// Length in millimeter of the short side of the page
const A0_SHORT_SIDE_MM = 841;
// Length in millimeter of the long side of the page
const A0_LONG_SIDE_MM = 1189;

// Ratios between A0 and the smaller Ax page size
const formatRatiosToA0: Record<PrintFormat, number> = {
  a0: SQRT_2 ** 0,
  a1: SQRT_2 ** 1,
  a2: SQRT_2 ** 2,
  a3: SQRT_2 ** 3,
  a4: SQRT_2 ** 4,
  a5: SQRT_2 ** 5,
};

/**
 * Get the print page size in meter for a given format (eg. 'a4') and an orientation (eg. 'landscape')
 */
export function getPageSizeInMeters(
  format: PrintFormat,
  orientation: PrintOrientation,
) {
  const longSide = ~~(A0_LONG_SIDE_MM / formatRatiosToA0[format]);
  const shortSide = ~~(A0_SHORT_SIDE_MM / formatRatiosToA0[format]);

  if (orientation === "landscape") {
    return { width: longSide, height: shortSide };
  } else {
    return { width: shortSide, height: longSide };
  }
}

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
}

export function getPrintExtent(
  map: OlMapType,
  printZoom: number,
  widthPx: number,
  heightPx: number,
  mapCenter: [number, number],
): Extent | null {
  const view = map.getView();

  const resolution = view.getResolutionForZoom(printZoom);
  if (!resolution) {
    return null;
  }

  const halfWidth = (widthPx * resolution) / 2;
  const halfHeight = (heightPx * resolution) / 2;

  return [
    mapCenter[0] - halfWidth,
    mapCenter[1] - halfHeight,
    mapCenter[0] + halfWidth,
    mapCenter[1] + halfHeight,
  ];
}
