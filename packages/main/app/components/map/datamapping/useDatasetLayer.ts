import type { DatasetLayer } from '@swissgeo/layers'
import type { Layer as MapLayer, LayerType } from '@swissgeo/map'
import type { Distribution } from '@swissgeo/ogc'

import {
    usePreferredDistribution,
    useDistribution,
    useDistributionCollection,
    useService,
} from '@swissgeo/ogc'

export function useDatasetLayer(
    layer: DatasetLayer,
    zIndex: number,
    removeCallback: () => void,
    updateCallback: (data: MapLayer) => void
) {
    const dataset = computed(() => layer.data)

    // holds the data that's specific for the layers
    const layerSpecificData = ref()

    const { distributionCollection } = useDistributionCollection(dataset)
    const { preferredDistributionId } = usePreferredDistribution(dataset)

    // if there's a preferred distribution, let's get that one, otherwise the first one
    const distributionId = computed(() => {
        if (
            !distributionCollection.value ||
            !distributionCollection.value ||
            !distributionCollection.value.records ||
            !distributionCollection.value.records.length
        ) {
            // If any of these is null-ish, then there's no point in returning the preferredDistributionId
            return null
        }
        return preferredDistributionId.value ?? distributionCollection.value.records[0]!.id
    })

    const { distribution, layerId } = useDistribution(distributionCollection, distributionId)
    const { serviceData } = useService(distribution)

    const layerType = computed(() => determineLayerType(distribution))
    const layerZIndex = computed(() => zIndex)

    /**
     * Reactively merge the data from the store as well as the
     * data from the OGC records
     */
    const layerData = computed((): MapLayer => {
        return {
            layerId: layerId.value,
            type: layerType.value,
            ...layerSpecificData.value,

            uuid: layer.uuid,

            // some data we pass directly from the original, so when it's updated
            // the change will be reflected in the data that the map receives
            dimensions: layer.dimensions,
            isVisible: layer.isVisible,
            opacity: layer.opacity,
            zIndex: layerZIndex.value,
        }
    })

    watch(layerData, () => updateCallback(layerData.value))

    onBeforeUnmount(() => {
        removeCallback()
    })

    function determineLayerType(distribution: Ref<Distribution | null>): LayerType {
        if (!distribution || !distribution.value || !distribution.value.properties) {
            return null
        }

        const protocol = distribution.value.properties.protocol

        let type = null
        switch (protocol) {
            case 'OGC:WMTS':
                type = 'WMTS'
                break
            case 'OGC:WMS':
                type = 'WMS'
                break
            case 'OGC:GeoJSON':
                // intentionally not implementing geojson for the moment, as these layers might
                // undergo major changes
                type = 'GeoJSON'
                break
        }

        return type
    }

    return {
        distributionCollection,
        layerSpecificData,
        distribution,
        serviceData,
        layerType,
        layerId,
    }
}
