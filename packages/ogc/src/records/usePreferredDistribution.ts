import type { Ref } from 'vue'

import { computed } from 'vue'

import type { Dataset } from '@/types/Records'

export function usePreferredDistribution(dataset: Ref<Dataset>) {
    const preferredDistributionId = computed(() => {
        if (!dataset || !dataset.value?.properties) {
            return null
        }

        return dataset.value.properties?.preferredDistributionId
    })

    return {
        preferredDistributionId,
    }
}
