import type { PrintOrientation, PrintFormat } from '@swissgeo/statesharing'

const MM_PER_INCH = 25.4
const SQRT_2 = 2 ** 0.5

// Length in millimeter of the short side of the page
const A0_SHORT_SIDE_MM = 841
// Length in millimeter of the long side of the page
const A0_LONG_SIDE_MM = 1189


const formatRatiosToA0: Record<PrintFormat, number> = {
    a0: SQRT_2 ** 0,
    a1: SQRT_2 ** 1,
    a2: SQRT_2 ** 2,
    a3: SQRT_2 ** 3,
    a4: SQRT_2 ** 4,
    a5: SQRT_2 ** 5,
}

/**
 * Get the print page size in pixels from a given format (eg. 'a4'), an orientation (eg. 'landscape') and a resolution in DPI (eg. 192)
 */
export function getPageSizeInPixels(format: PrintFormat, orientation: PrintOrientation, resolutionDpi: number): { width: number, height: number } {
    const longSide = resolutionDpi * ~~(A0_LONG_SIDE_MM / formatRatiosToA0[format]) / MM_PER_INCH
    const shortSide = resolutionDpi * ~~(A0_SHORT_SIDE_MM / formatRatiosToA0[format]) / MM_PER_INCH
    return orientation === 'landscape' ? { width: longSide, height: shortSide } : { width: shortSide, height: longSide }
}
