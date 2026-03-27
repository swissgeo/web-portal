import type { DatasetLayer } from '@swissgeo/layers'
import type { LayerFormat } from '@swissgeo/map'
import type { Distribution } from '@swissgeo/ogc'

import {
    usePreferredDistribution,
    useDistribution,
    useDistributionCollection,
    useService,
} from '@swissgeo/ogc'

export function useGenericOgcData(layer: Ref<DatasetLayer>) {
    const dataset = computed(() => layer.value.data)

    const { distributionCollection } = useDistributionCollection(dataset)
    const { preferredDistributionId } = usePreferredDistribution(dataset)

    // if there's a preferred distribution, let's get that one, otherwise the first one
    const distributionId = computed(() => {
        if (!distributionCollection.value?.records?.length) {
            // If any of these is null-ish, then there's no point in returning the preferredDistributionId
            return null
        }
        return preferredDistributionId.value ?? distributionCollection.value.records[0]!.id
    })

    const { distribution, layerId } = useDistribution(distributionCollection, distributionId)
    const { serviceData } = useService(distribution)

    const layerFormat = computed(() => determineFormat(distribution))

    function determineFormat(distribution: Ref<Distribution | null>): LayerFormat {
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
        distribution,
        serviceData,
        layerFormat,
        layerId,
    }
}
