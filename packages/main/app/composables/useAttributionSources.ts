import type { Layer } from '@swissgeo/layers'
import type { MaybeRefOrGetter } from 'vue'

import { computed, toValue } from 'vue'

export interface AttributionSource {
    id: string
    name: string
    url?: string
}

export function useAttributionSources(
    layers: MaybeRefOrGetter<Layer[]>,
    backgroundLayer: MaybeRefOrGetter<Layer | null>
) {
    const sources = computed((): AttributionSource[] => {
        const resolvedLayers = toValue(layers)
        const resolvedBackground = toValue(backgroundLayer)

        const attributedLayers: Layer[] = []

        if (resolvedBackground?.isVisible && resolvedBackground.info?.attribution?.title) {
            attributedLayers.push(resolvedBackground)
        }

        attributedLayers.push(
            ...resolvedLayers
                .filter((layer) => layer.isVisible)
                .filter((layer) => !!layer.info?.attribution?.title)
        )

        return attributedLayers
            .map((layer) => {
                const title = layer.info?.attribution?.title
                if (!title) {
                    return null
                }
                return {
                    id: title.replace(/[._]/g, '-'),
                    name: title,
                    url: layer.info?.attribution?.url,
                }
            })
            .filter((source) => source !== null)
            .filter(
                (source, index, array) => array.findIndex((s) => s.name === source.name) === index
            ) as AttributionSource[]
    })

    return { sources }
}
