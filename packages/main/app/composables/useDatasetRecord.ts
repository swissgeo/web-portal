import type { Dataset, DistributionCollection } from '@swissgeo/ogc'

import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export function useDatasetRecord(id: MaybeRefOrGetter<string | null>) {
    const runtimeConfig = useRuntimeConfig()
    const { locale } = useI18n()

    const {
        data: dataset,
        status,
        error,
    } = useAsyncData<Dataset | null>(
        () => `dataset-${toValue(id)}-${locale.value}`,
        async () => {
            const resolvedId = toValue(id)
            if (!resolvedId) {
                return null
            }
            return $fetch<Dataset>(
                `${runtimeConfig.public.ogcApiEndpoint}/items/${resolvedId}?language=${locale.value}`
            )
        },
        { watch: [() => toValue(id), locale] }
    )

    const { data: distributionCollection } = useAsyncData<DistributionCollection | null>(
        () => `dataset-distributions-${toValue(id)}-${locale.value}`,
        async () => {
            const distributionsLink = dataset.value?.links?.find((l) => l.rel === 'distributions')
            if (!distributionsLink?.href) {
                return null
            }
            return $fetch<DistributionCollection>(
                `${distributionsLink.href}?language=${locale.value}`
            )
        },
        { watch: [dataset] }
    )

    const isLoading = computed(() => status.value === 'pending')

    return {
        dataset,
        distributionCollection,
        isLoading,
        error,
    }
}
