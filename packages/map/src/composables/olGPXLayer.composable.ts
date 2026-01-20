import log from '@swissgeo/log'
import GPX from 'ol/format/GPX'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle, Fill, Stroke, Style } from 'ol/style'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'

export default function useOlGPXLayer(
    layerId: string,
    uuid: string,
    gpxData: string,
    opacity: number,
    zIndex: number
) {
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
            featureProjection: 'EPSG:3857', // Web Mercator
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

    return { initialize, setVisibility, setZIndex }
}
