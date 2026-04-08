import type { AnyLayer, RasterLayer, Style } from 'mapbox-gl'

const FALLBACK_OPACITY = 1
const FALLBACK_GUTTER = 0

function getFirstRasterPaint(styleData: Pick<Style, 'layers'>) {
    const isRasterLayer = (layer: AnyLayer): layer is RasterLayer => layer.type === 'raster'

    if (styleData && styleData.layers?.length) {
        // so far, we assume that the first and only entry is the correct one
        const layer = styleData.layers[0]

        if (layer && isRasterLayer(layer)) {
            return layer.paint
        }
    }
    return undefined
}

export function defaultOpacityFromStyle(styleData: Pick<Style, 'layers'>) {
    const paint = getFirstRasterPaint(styleData)
    const rasterOpacity = paint?.['raster-opacity']
    if (rasterOpacity && typeof rasterOpacity === 'number') {
        return rasterOpacity
    }
    return FALLBACK_OPACITY
}

export function defaultGutterFromStyle(styleData: Pick<Style, 'layers'>) {
    const paint = getFirstRasterPaint(styleData)
    // raster-gutter is a custom extension, not part of the MapBox GL spec
    const rasterGutter = (paint as Record<string, unknown> | undefined)?.['raster-gutter']
    if (rasterGutter && typeof rasterGutter === 'number') {
        return rasterGutter
    }
    return FALLBACK_GUTTER
}
