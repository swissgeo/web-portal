import log from '@swissgeo/log'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import proj4 from 'proj4'

import { EPSG_4326_WGS84 } from '@/composables/types'
import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlKMLLayer(
    layerId: string,
    uuid: string,
    kmlData: string,
    opacity: number,
    zIndex: number
) {
    const positionStore = usePositionStore()
    const layer = new VectorLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity,
    })

    function initialize(): void {
        log.debug(`Initializing KML layer ${layerId}`)

        const format = new KML({
            extractStyles: true, // Extract styles from KML
        })
        register(proj4)
        const features = format.readFeatures(kmlData, {
            featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
            dataProjection: EPSG_4326_WGS84, // WGS84
        })

        const source = new VectorSource({
            features,
        })

        layer.setSource(source)
        log.debug(`KML layer ${layerId} initialized with ${features.length} features`)
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return { initialize, setVisibility, setZIndex }
}
