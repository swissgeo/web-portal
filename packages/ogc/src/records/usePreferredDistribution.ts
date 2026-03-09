import type { Ref } from 'vue'

import { computed } from 'vue'

import type { Dataset } from '@/types/Records'

export function usePreferredDistribution(dataset: Ref<Pick<Dataset, 'properties'> | null>) {
    const preferredDistributionId = computed(() => {
        return dataset?.value?.properties?.preferredDistributionId ?? null
    })

    return {
        preferredDistributionId,
    }
}
