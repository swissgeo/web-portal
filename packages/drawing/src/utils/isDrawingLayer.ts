import type { Layer } from '@swissgeo/layers'

import { DRAWING_LAYER_ID } from '@swissgeo/shared'

export function isDrawingLayer(layer: Layer): boolean {
    return layer.humanId === DRAWING_LAYER_ID && layer.type === 'kml'
}
