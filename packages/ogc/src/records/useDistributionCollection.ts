import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { useFetch } from '@vueuse/core'
import { computed, toValue, watchEffect } from 'vue'

import type { Dataset, DistributionCollection } from '@/types/Records'

export function useDistributionCollection(dataset: Ref<Dataset>) {
    const distributionUrl = computed(() => extractDistributionLink(dataset.value))

    const {
        data: distributionCollection,
        isFetching,
        error,
    } = useFetch<DistributionCollection>(distributionUrl, { refetch: true }).get().json()

    // Debug watchers
    watchEffect(() => {
        log.debug({
            title: 'useDistributionCollection',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['Distribution URL is', toValue(distributionUrl)],
        })
    })

    watchEffect(() =>
        log.debug({
            title: 'useDistributionCollection',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['Fetched the distribution collection data', toValue(distributionCollection)],
        })
    )

    return {
        distributionUrl,
        distributionCollection,
        isFetching,
        error,
    }
}

export function extractDistributionLink(dataset: Dataset): string {
    const links = dataset.links

    if (!links) {
        log.error({
            title: 'useDistributionCollection',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['There were no links in the dataset', dataset],
        })
        throw Error('Unable to find links in the dataset')
    }
    for (const link of links) {
        if (link.rel?.toLowerCase() === 'distributions') {
            return link.href
        }
    }

    log.error({
        title: 'useDistributionCollection',
        titleColor: LogPreDefinedColor.Yellow,
        messages: ['Unable to extract a distribution link', dataset.links],
    })
    return ''
}
