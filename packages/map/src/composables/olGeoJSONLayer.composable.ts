import type { GeoAdminGeoJSONStyleDefinition } from '@swissgeo/layers'
import type { GeoJsonObject } from 'geojson'
import type { Map } from 'ol'
import type { FeatureLike } from 'ol/Feature'
import type { MaybeRef } from 'vue'

import log from '@swissgeo/log'
import { Feature } from 'ol'
import GeoJSON from 'ol/format/GeoJSON'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'
import { reprojectGeoJsonGeometry } from '@/utils/geoJsonUtils'

import OlStyleForPropertyValue from '../utils/geoJsonStyleFromLiterals'

export default function useOlGeoJSONLayer(
    layerId: string,
    uuid: string,
    opacity: number,
    isLoading: boolean,
    geoJsonData: MaybeRef<GeoJsonObject>,
    geoJsonStyle: GeoAdminGeoJSONStyleDefinition,
    zIndex: number
) {
    const positionStore = usePositionStore()

    const layer = new VectorLayer({
        properties: {
            id: layerId,
            uuid,
        },
        opacity: opacity,
    })

    function setGeoJsonStyle(): void {
        if (!geoJsonStyle) {
            log.debug('style was not loaded, could not create source')
            return
        }
        log.debug(`Setting geoJSON style ${JSON.stringify(geoJsonStyle)}`)
        const styleFunction = new OlStyleForPropertyValue(geoJsonStyle)
        layer.setStyle((feature: FeatureLike, res) => {
            // OpenLayers passes FeatureLike, but our style function expects Feature
            // RenderFeature doesn't have the same methods as Feature, so we need to handle this
            if (feature instanceof Feature) {
                return styleFunction.getFeatureStyle(feature, res)
            }
            // For RenderFeature, return a default style or handle differently
            return styleFunction.defaultStyle
        })
    }
    function setFeatures(): void {
        if (!geoJsonData) {
            log.debug('no GeoJSON data loaded yet, could not create source')
            return
        }

        log.debug(`Setting geoJSON source ${JSON.stringify(toValue(geoJsonData))}`)

        layer.setSource(
            new VectorSource({
                features: new GeoJSON().readFeatures(
                    // TODO why toValue
                    // toValue(geoJsonData)
                    reprojectGeoJsonData(toValue(geoJsonData), positionStore.projection)
                ),
            })
        )
    }

    function initialize(): void {
        setGeoJsonStyle()
        setFeatures()
    }

    const { setVisibility, setZIndex } = useAddLayerToMap(layer, zIndex)

    return {
        initialize,
        setVisibility,
        setZIndex,
    }
}
