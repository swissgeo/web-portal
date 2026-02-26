import log from '@swissgeo/log'
import { EPSG_4326_WGS84 } from '@swissgeo/shared'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import proj4 from 'proj4'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'
import { createTextFeatureStyle } from '@swissgeo/drawing'

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
            extractStyles: true, // Extract styles from KML for non-text features
        })
        register(proj4)
        const features = format.readFeatures(kmlData, {
            featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
            dataProjection: EPSG_4326_WGS84, // WGS84
        })

        // Restore text properties for text features
        features.forEach((feature) => {
            const name = feature.get('name')
            const text = feature.get('text')
            const isTextFeature = feature.get('isTextFeature')
            const geometry = feature.getGeometry()

            // If marked as text feature or has text without iconId, treat as text
            if (
                isTextFeature ||
                (text && geometry?.getType() === 'Point' && !feature.get('iconId'))
            ) {
                const textContent = text || name
                feature.set('text', textContent)
                feature.set('isTextFeature', true)
                feature.setStyle(createTextFeatureStyle(textContent))
            }
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
