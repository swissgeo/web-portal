import type { Ref } from 'vue'

//import log, { LogPreDefinedColor } from '@swissgeo/log'
import { computed } from 'vue'

import type { Distribution } from '@/types'

// import { useConditionalFetch } from './useConditionalFetch'

export function useVector(distribution: Ref<Distribution | null>) {
    // const dataUrl = computed(() => extractVectorTileUrl(distribution.value))
    const styleUrl = computed(() => extractVectorStyleUrl(distribution.value))

    // const { data: vectorTileData } = useConditionalFetch<string>(dataUrl)
    // const { data: vectorStyleData } = useConditionalFetch<string>(styleUrl)

    // const data = computed(() => ({
    //     tileData: JSON.parse(vectorTileData.value || '{}'),
    //     styleData: JSON.parse(vectorStyleData.value || '{}'),
    // }))

    // watchEffect(() => {
    //     log.debug({
    //         title: 'useVector',
    //         titleColor: LogPreDefinedColor.Indigo,
    //         messages: ['Loaded vectorTile', data.value.tileData],
    //     })
    // })

    // watchEffect(() => {
    //     log.debug({
    //         title: 'useVector',
    //         titleColor: LogPreDefinedColor.Indigo,
    //         messages: ['Loaded vectorStyle', data.value.styleData],
    //     })
    // })

    return {
        // vectorData: data,
        styleUrl,
    }
}

// function extractVectorTileUrl(distribution: Pick<Distribution, 'links'> | null) {
//     if (!distribution || !distribution.links) {
//         return null
//     }

//     const dataLinks = distribution.links.filter((link) => link.rel.toLowerCase() === 'data')

//     if (dataLinks.length && dataLinks[0]) {
//         return dataLinks[0].href
//     }

//     // TODO warn
//     return null
// }

function extractVectorStyleUrl(distribution: Pick<Distribution, 'links'> | null) {
    if (!distribution || !distribution.links) {
        return null
    }

    const styleLinks = distribution.links.filter((link) => link.rel.toLowerCase() === 'styledby')

    if (styleLinks.length && styleLinks[0]) {
        return styleLinks[0].href
    }

    // TODO warn
    return null
}
