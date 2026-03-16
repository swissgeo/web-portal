import type { AnyLayer, RasterLayer, Style } from 'mapbox-gl'

const DEFAULT_OPACITY = 1

export function defaultOpacityFromStyle(styleData: Style) {
    const isRasterLayer = (layer: AnyLayer): layer is RasterLayer => layer.type === 'raster'

    if (styleData && styleData.layers?.length) {
        // so far, we assume that the first and only entry is the correct one
        const layer = styleData.layers[0]

        if (!layer || !isRasterLayer(layer)) {
            return DEFAULT_OPACITY
        }

        const paint = layer.paint
        const rasterOpacity = paint?.['raster-opacity']
        if (rasterOpacity && typeof rasterOpacity === 'number') {
            return rasterOpacity
        }
    }
    return DEFAULT_OPACITY
}
