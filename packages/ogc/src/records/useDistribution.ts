import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { computed, toValue, watchEffect } from 'vue'

import type { Distribution, DistributionCollection } from '@/types/Records'

export function useDistribution(
    distributionCollection: Ref<DistributionCollection | null>,
    distributionId: Ref<string | null>
) {
    const distribution = computed(() => {
        return extractDistribution(distributionCollection.value, distributionId.value)
    })

    // TODO not sure if this is the right one
    const layerId = computed(() => distributionCollection.value?.id || null)

    watchEffect(() =>
        log.debug({
            title: 'useDistribution',
            titleColor: LogPreDefinedColor.Amber,
            messages: [
                'Extracted <distribution> with <layerId> from <collection> based on <distributionId>',
                toValue(distribution),
                toValue(layerId),
                toValue(distributionCollection),
                toValue(distributionId),
            ],
        })
    )

    return { distribution, layerId }
}

export function extractDistribution(
    collection: DistributionCollection | null,
    distributionId: string | null
): Distribution | null {
    if (!collection || !('records' in collection) || !distributionId) {
        return null
    }

    const records = collection.records

    for (const distribution of records) {
        if (distribution.id === distributionId) {
            // we found the feature with the id that's requested, carry on
            return distribution
        }
    }

    log.warn({
        title: 'useDistribution',
        titleColor: LogPreDefinedColor.Amber,
        messages: [`Unable to find ${distributionId} in collection`, collection],
    })
    return null
}
