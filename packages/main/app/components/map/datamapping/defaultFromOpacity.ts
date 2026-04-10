import type { Style } from 'mapbox-gl'

import { getFirstRasterPaint } from './styleUtils'

const FALLBACK_OPACITY = 1

export function defaultOpacityFromStyle(styleData: Pick<Style, 'layers'>) {
    const paint = getFirstRasterPaint(styleData)
    const rasterOpacity = paint?.['raster-opacity']
    if (rasterOpacity && typeof rasterOpacity === 'number') {
        return rasterOpacity
    }
    return FALLBACK_OPACITY
}
