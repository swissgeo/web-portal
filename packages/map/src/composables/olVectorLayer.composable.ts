import type { Map } from 'ol'

import log from '@swissgeo/log'
import { apply } from 'ol-mapbox-style'
import LayerGroup from 'ol/layer/Group'

import useAddLayerToMap from './useAddLayerToMap.composable'

export default function useOlVectorLayer(layerId: string, zIndex: number, style: string) {
    const olMap = toValue(inject<Map>('olMap'))
    const layerGroup = new LayerGroup()

    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }

    apply(layerGroup, style)
        .then(() => {
            layerGroup.setZIndex(zIndex)
        })
        .catch(() => {
            log.error(`Unable to load and attach the style for ${layerId}`)
        })

    const { setVisibility, setZIndex } = useAddLayerToMap(layerGroup, zIndex)

    return {
        setVisibility,
        setZIndex,
    }
}
