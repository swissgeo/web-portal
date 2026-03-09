import type { Ref } from 'vue'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { useFetch } from '@vueuse/core'
import { computed } from 'vue'

import type { Distribution, Link } from '@/types/Records'

export function useStyle(distribution: Ref<Distribution | null>) {
    const styleDataUrl = computed(() =>
        distribution.value ? extractStyleUrl(distribution.value) : null
    )

    if (!styleDataUrl.value) {
        log.error({})
        throw new Error() // TODO
    }

    const { data: styleData } = useFetch(styleDataUrl.value)

    return {
        styleDataUrl,
        styleData,
    }
}

export function extractStyleUrl(distributionData: Distribution): string | null {
    const links = distributionData.links

    if (!links) {
        log.error({
            title: 'useStyle',
            titleColor: LogPreDefinedColor.Yellow,
            messages: ['Unable to find links in distribution', distributionData],
        })
        throw new Error(`Unable to find links for distribution}`)
    }

    const link = getStyleLinks(links)[0]
    if (!link) {
        return null
    }

    const href = link.href

    if (!href) {
        throw new Error(`Faulty styledby record`)
    }
    return href
}

function getStyleLinks(links: Link[]) {
    return links.filter((link) => link.rel.toLowerCase() === 'styledby')
}
