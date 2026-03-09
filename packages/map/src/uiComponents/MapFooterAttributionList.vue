<script setup lang="ts">
// import type { Layer } from '@swissgeo/layers'

// import { computed } from 'vue'
// import { useI18n } from 'vue-i18n'

// import MapFooterAttributionItem from './attributionsDisplay/MapFooterAttributionItem.vue'
// //import ThirdPartyDisclaimer from '@/utils/components/ThirdPartyDisclaimer.vue'

// const { t } = useI18n()
// const { layers, backgroundLayer } = defineProps<{
//     layers: Layer[]
//     backgroundLayer: Layer | null
// }>()

// const visibleLayers = computed(() => {
//     return layers.filter((layer) => layer.isVisible)
// })

// const attributedLayers = computed(() => {
//     const layersWithAttributions = []
//     if (backgroundLayer && backgroundLayer.info?.attribution) {
//         layersWithAttributions.push(backgroundLayer)
//     }
//     layersWithAttributions.push(
//         ...visibleLayers.value.filter((layer) => !!layer.info?.attribution?.title)
//     )
//     return layersWithAttributions
// })

// const sources = computed(() => {
//     return attributedLayers.value
//         .map((layer) => {
//             return {
//                 id: layer?.info!.attribution!.title.replace(/[._]/g, '-'),
//                 name: layer?.info!.attribution!.title,
//                 url: layer?.info!.attribution!.url,
//                 /*
//                 TODO:
//                 hasDataDisclaimer: layersStore.hasDataDisclaimer(layer.id, {
//                     isExternal: layer.isExternal,
//                     baseUrl: layer.baseUrl,
//                 }),
//                 isLocalFile: layersStore.isLocalFile(layer),
//                 */
//                 hasDataDisclaimer: false,
//                 isLocalFile: false,
//             }
//         })
//         .flat()
//         .filter((attribution, index, array) => {
//             const firstIndex = array.findIndex((item) => item.name === attribution.name)
//             return index === firstIndex
//         })
// })
</script>

<template>
    <div></div>
    <!-- <div
        class="fixed bottom-[3rem] left-[5rem] max-w-[200px] bg-white text-sm"
        data-cy="layers-copyrights"
    >
        <span v-if="sources.length > 0">{{ t('copyright_data') }}</span>
        <span
            v-for="(source, index) in sources"
            :key="source.name"
            class="d-inline-flex"
        >
                <ThirdPartyDisclaimer
                v-if="source.hasDataDisclaimer"
                :source-name="source.name"
                :complete-disclaimer-on-click="!source.url"
                :is-local-file="source.isLocalFile"
            >
                <MapFooterAttributionItem
                    :source-id="source.id"
                    :source-name="source.name"
                    :source-url="source.url"
                    :has-data-disclaimer="true"
                    :is-last="index === sources.length - 1"
                />
            </ThirdPartyDisclaimer>
                add back the v-else if we add back the third party disclaimer.
            <MapFooterAttributionItem
                :source-id="source.id"
                :source-name="source.name"
                :source-url="source.url"
                :has-data-disclaimer="false"
                :is-last="index === sources.length - 1"
            />
        </span>
    </div> -->
</template>

<style scoped></style>
