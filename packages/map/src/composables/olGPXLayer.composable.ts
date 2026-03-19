import type { Map } from 'ol'
import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { EPSG_4326_WGS84 } from '@swissgeo/shared'
import GPX from 'ol/format/GPX'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Circle, Fill, Stroke, Style } from 'ol/style'
import { computed, ref, watch } from 'vue'

import type { GPXLayer } from '@/types'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlGPXLayer(
    layer: Ref<GPXLayer>,
    olMap: Ref<Map | undefined> | undefined
) {
    const positionStore = usePositionStore()
    const layerId = computed(() => layer.value.layerId)
    const zIndex = computed(() => layer.value.zIndex)
    const isVisible = computed(() => layer.value.isVisible)
    const opacity = computed(() => layer.value.opacity)
    const gpxData = computed(() => layer.value.data)

    const olLayer = ref<VectorLayer>()

    watch(
        () => gpxData.value,
        () => {
            olLayer.value = new VectorLayer({
                properties: {
                    id: layerId.value,
                    uuid: layer.value.uuid,
                },
                opacity: opacity.value,
            })

            initialize()
        },
        { immediate: true }
    )

    function initialize(): void {
        log.debug({
            title: 'useOlGPXLayer',
            titleColor: LogPreDefinedColor.Fuchsia,
            messages: [`Initializing GPX layer ${layerId.value}`],
        })

        const format = new GPX()

        const features = format.readFeatures(gpxData.value, {
            featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
            dataProjection: EPSG_4326_WGS84, // WGS84
        })

        const source = new VectorSource({
            features,
        })

        if (!olLayer.value) {
            return
        }

        // Apply default styling for GPX tracks and waypoints
        olLayer.value.setStyle(
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

        olLayer.value.setSource(source)
        log.debug({
            title: 'useOlGPXLayer',
            titleColor: LogPreDefinedColor.Fuchsia,
            messages: [`GPX layer ${layerId.value} initialized with ${features.length} features`],
        })
    }

    const { addLayerToMap } = useAddLayerToMap(olLayer, zIndex, isVisible, opacity, olMap)

    watch(
        () => olLayer.value,
        () => {
            addLayerToMap()
        },
        { immediate: true }
    )

    return {}
}
