import type { Dataset, DistributionCollection } from '@swissgeo/ogc'
import type { MaybeRefOrGetter } from 'vue'

import { toValue } from 'vue'

interface DatasetRecord {
    dataset: Dataset | null
    distributionCollection: DistributionCollection | null
}

export function useDatasetRecord(id: MaybeRefOrGetter<string | null>) {
    const runtimeConfig = useRuntimeConfig()
    const { locale } = useI18n()

    const { data, status, error } = useAsyncData<DatasetRecord>(
        () => `dataset-record-${toValue(id)}-${locale.value}`,
        async () => {
            const resolvedId = toValue(id)
            if (!resolvedId) {
                return { dataset: null, distributionCollection: null }
            }

            const dataset = await $fetch<Dataset>(
                `${runtimeConfig.public.ogcApiEndpoint}/items/${resolvedId}?language=${locale.value}`
            )

            const distributionsLink = dataset.links?.find((l) => l.rel === 'distributions')
            if (!distributionsLink?.href) {
                return { dataset, distributionCollection: null }
            }

            const distributionCollection = await $fetch<DistributionCollection>(
                `${distributionsLink.href}?language=${locale.value}`
            )

            return { dataset, distributionCollection }
        },
        { watch: [() => toValue(id), locale] }
    )

    const dataset = computed(() => data.value?.dataset ?? null)
    const distributionCollection = computed(() => data.value?.distributionCollection ?? null)
    const isLoading = computed(() => status.value === 'pending')

    return {
        dataset,
        distributionCollection,
        isLoading,
        error,
    }
}
