<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Layer } from '@/types/layers'

import MapFooterAttributionItem from './attributionsDisplay/MapFooterAttributionItem.vue'
// //import ThirdPartyDisclaimer from '@/utils/components/ThirdPartyDisclaimer.vue'

const { t } = useI18n()
const { layers, backgroundLayer } = defineProps<{
    layers: Layer[]
    backgroundLayer: Layer | null
}>()

const visibleLayers = computed(() => {
    return layers.filter((layer) => layer.isVisible)
})

const attributedLayers = computed(() => {
    const layersWithAttributions: Layer[] = []

    if (backgroundLayer?.isVisible && backgroundLayer.info?.attribution?.title) {
        layersWithAttributions.push(backgroundLayer)
    }

    layersWithAttributions.push(
        ...visibleLayers.value.filter((layer) => !!layer.info?.attribution?.title)
    )

    return layersWithAttributions
})

const sources = computed(() => {
    return attributedLayers.value
        .map((layer) => {
            const title = layer.info?.attribution?.title
            if (!title) {
                return null
            }

            return {
                id: title.replace(/[._]/g, '-'),
                name: title,
                url: layer.info?.attribution?.url,
                hasDataDisclaimer: false,
                isLocalFile: false,
            }
        })
        .filter((source): source is NonNullable<typeof source> => !!source)
        .filter((attribution, index, array) => {
            const firstIndex = array.findIndex((item) => item.name === attribution.name)
            return index === firstIndex
        })
})
</script>

<template>
    <div
        class="fixed bottom-[3rem] left-[5rem] z-[1000] max-w-[200px] bg-white px-1 text-sm text-black"
        data-cy="layers-copyrights"
        v-if="sources.length > 0"
    >
        <span>{{ t('footer.copyRightData') }}</span>
        <span
            v-for="(source, index) in sources"
            :key="source.name"
            class="d-inline-flex"
        >
            <MapFooterAttributionItem
                :source-id="source.id"
                :source-name="source.name"
                :source-url="source.url"
                :has-data-disclaimer="false"
                :is-last="index === sources.length - 1"
            />
        </span>
    </div>
</template>

<style scoped></style>
