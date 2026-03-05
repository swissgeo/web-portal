import type { Map } from 'ol'
import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { createTextFeatureStyle, EPSG_4326_WGS84 } from '@swissgeo/shared'
import KML from 'ol/format/KML'
import VectorLayer from 'ol/layer/Vector'
import { register } from 'ol/proj/proj4'
import VectorSource from 'ol/source/Vector'
import proj4 from 'proj4'
import { computed, ref, watch } from 'vue'

import type { KMLLayer } from '@/types'

import useAddLayerToMap from '@/composables/useAddLayerToMap.composable'
import usePositionStore from '@/stores/position'

export default function useOlKMLLayer(
    layer: Ref<KMLLayer>,
    olMap: Ref<Map | undefined> | undefined
) {
    const layerId = computed(() => layer.value.layerId)
    const zIndex = computed(() => layer.value.zIndex)
    const isVisible = computed(() => layer.value.isVisible)
    const opacity = computed(() => layer.value.opacity)
    const kmlData = computed(() => layer.value.fileData)

    const positionStore = usePositionStore()

    const olLayer = ref<VectorLayer>()

    watch(
        () => kmlData.value,
        () => {
            olLayer.value = new VectorLayer({
                properties: {
                    id: layerId,
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
            title: 'useOlKMLLayer',
            titleColor: LogPreDefinedColor.Fuchsia,
            messages: [`Initializing KML layer ${layerId.value}`],
        })

        const format = new KML({
            extractStyles: true, // Extract styles from KML for non-text features
        })
        register(proj4)
        const features = format.readFeatures(kmlData.value, {
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

        if (olLayer.value) {
            olLayer.value.setSource(source)
        }
        log.debug({
            title: 'useOlKmlLayer',
            titleColor: LogPreDefinedColor.Fuchsia,
            messages: [`KML layer ${layerId.value} initialized with ${features.length} features`],
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
