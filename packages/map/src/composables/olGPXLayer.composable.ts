import log from '@swissgeo/log'
import { EPSG_4326_WGS84 } from '@swissgeo/shared'
import GPX from 'ol/format/GPX'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle, Fill, Stroke, Style } from 'ol/style'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlGPXLayer(
    layerId: string,
    uuid: string,
    gpxData: string,
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
        log.debug(`Initializing GPX layer ${layerId}`)

        const format = new GPX()

        const features = format.readFeatures(gpxData, {
            featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
            dataProjection: EPSG_4326_WGS84, // WGS84
        })

        const source = new VectorSource({
            features,
        })

        // Apply default styling for GPX tracks and waypoints
        layer.setStyle(
            new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 0, 255, 0.8)',
                    width: 3,
                }),
                fill: new Fill({
                    color: 'rgba(0, 0, 255, 0.1)',
                }),
                image: new Circle({
                    radius: 6,
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.8)',
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            })
        )

        layer.setSource(source)
        log.debug(`GPX layer ${layerId} initialized with ${features.length} features`)
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    function setOpacity(opacity: number) {
        layer.setOpacity(opacity)
    }

    return { initialize, setVisibility, setZIndex, setOpacity }
}
