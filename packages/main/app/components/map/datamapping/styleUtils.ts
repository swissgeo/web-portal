import type { AnyLayer, RasterLayer, Style } from 'mapbox-gl'

export function getFirstRasterPaint(styleData: Pick<Style, 'layers'>) {
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
