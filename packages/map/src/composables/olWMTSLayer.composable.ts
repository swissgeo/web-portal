import type { Options as WMTSOptions } from 'ol/source/WMTS'

import log from '@swissgeo/log'
import { Tile as TileLayer } from 'ol/layer'
import WMTS from 'ol/source/WMTS'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'

export default function useOlWmtsLayer(
    layerId: string,
    uuid: string,
    options: WMTSOptions,
    opacity: number,
    zIndex: number
) {
    const layer = new TileLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
    })

    function initialize(): void {
        log.debug(`Set WMTS source for layer ${layerId} with options`, { messages: [options] })

        layer.setSource(new WMTS({ ...options /*, dimensions: dimensions.value*/ }))
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return { initialize, setVisibility, setZIndex }
}
