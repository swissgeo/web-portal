import type { Style } from 'mapbox-gl'

import { getFirstRasterPaint } from './styleUtils'

const FALLBACK_GUTTER = 0

export function defaultGutterFromStyle(styleData: Pick<Style, 'layers'>) {
    const paint = getFirstRasterPaint(styleData)
    // raster-gutter is a custom extension, not part of the MapBox GL spec
    const rasterGutter = (paint as Record<string, unknown> | undefined)?.['raster-gutter']
    if (rasterGutter && typeof rasterGutter === 'number') {
        return rasterGutter
    }
    return FALLBACK_GUTTER
}
