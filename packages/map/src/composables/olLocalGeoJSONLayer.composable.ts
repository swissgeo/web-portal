import log, { LogPreDefinedColor } from '@swissgeo/log'
import GeoJSON from 'ol/format/GeoJSON'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlLocalGeoJSONLayer(
    layerId: string,
    uuid: string,
    geoJsonData: string,
    opacity: number,
    zIndex: number
) {
    const positionStore = usePositionStore()

    const layer = new VectorLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity: opacity,
        style: new Style({
            fill: new Fill({
                color: 'rgba(255, 0, 0, 0.2)',
            }),
            stroke: new Stroke({
                color: '#ff0000',
                width: 2,
            }),
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({
                    color: '#ff0000',
                }),
            }),
        }),
    })

    function setFeatures(): void {
        if (!geoJsonData) {
            log.error('No GeoJSON data provided')
            return
        }

        try {
            const features = new GeoJSON().readFeatures(geoJsonData, {
                dataProjection: 'EPSG:4326',
                featureProjection: positionStore.projection.epsg,
            })

            layer.setSource(
                new VectorSource({
                    features,
                })
            )

            log.debug(`Loaded ${features.length} features from local GeoJSON file`)
        } catch (error) {
            log.error({
                title: 'DrawingPanel/handleExport',
                titleColor: LogPreDefinedColor.Red,
                messages: ['Failed to parse GeoJSON data:', error],
            })
            throw error
        }
    }

    function initialize(): void {
        setFeatures()
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return {
        initialize,
        setVisibility,
        setZIndex,
    }
}
