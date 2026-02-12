import type { Options as WMTSOptions } from 'ol/source/WMTS'

import log from '@swissgeo/log'
import { Tile as TileLayer } from 'ol/layer'
import WMTS from 'ol/source/WMTS'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'

/** Tying a layer object from the app to a openlayers object */
export default function useOlWmtsLayer(
    layerId: string,
    uuid: string,
    options: WMTSOptions,
    opacity: number,
    zIndex: number,
    initialTimestamp: string | null
) {
    const layer = new TileLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
    })

    let source: WMTS

    function getTimeConfig(timestamp: string | null) {
        return { dimensions: { Time: timestamp ?? 'current' } }
    }

    const wmtsTimeConfig = computed(() => {
        return getTimeConfig(initialTimestamp)
    })

    function initialize(): void {
        const definitiveOptions = {
            ...options,
            ...wmtsTimeConfig.value,
        }
        // if (options && options.tileGrid) {
        log.debug(`Set WMTS source for layer ${layerId} with options`, {
            messages: [definitiveOptions],
        })

        source = new WMTS(definitiveOptions)

        layer.setSource(source)
    }

    function updateTimeDimension(newTimestamp: string) {
        if (!source) {
            log.warn(`Cannot update time dimension for ${layerId}: source not initialized yet`)
            return
        }
        log.debug(`Updating the time for ${layerId} to ${newTimestamp}`)
        const timeConfig = getTimeConfig(newTimestamp)
        source.updateDimensions(timeConfig.dimensions)
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return { initialize, setVisibility, setZIndex, updateTimeDimension }
}
