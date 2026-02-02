<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import MapFooterAttributionItem from './MapFooterAttributionItem.vue'
import { useLayerStore } from '@swissgeo/layers'
//import ThirdPartyDisclaimer from '@/utils/components/ThirdPartyDisclaimer.vue'

const layersStore = useLayerStore()
const { t } = useI18n()

const visibleLayers = computed(() => layersStore.visibleLayers)
const backgroundLayer = computed(() => layersStore.backgroundLayer)

const layers = computed(() => {
    const layersWithAttributions = []
    // when the background is void, we receive `undefined` here
    if (backgroundLayer.value && backgroundLayer.value.info?.attribution) {
        layersWithAttributions.push(backgroundLayer.value)
    }
    layersWithAttributions.push(
        ...visibleLayers.value.filter((layer) => !!layer.info?.attribution?.title)
    )
    return layersWithAttributions
})

const sources = computed(() => {
    return layers.value
        .map((layer) => {
            return {
                id: layer.info!.attribution!.title.replace(/[._]/g, '-'),
                name: layer.info!.attribution!.title,
                url: layer.info!.attribution!.url,
                /*
                TODO:
                hasDataDisclaimer: layersStore.hasDataDisclaimer(layer.id, {
                    isExternal: layer.isExternal,
                    baseUrl: layer.baseUrl,
                }),
                isLocalFile: layersStore.isLocalFile(layer),
                */
                hasDataDisclaimer: false,
                isLocalFile: false,
            }
        })
        .flat()
        .filter((attribution, index, array) => {
            const firstIndex = array.findIndex((item) => item.name === attribution.name)
            return index === firstIndex
        })
})
</script>

<template>
    <div
        class="map-footer-attribution"
        data-cy="layers-copyrights"
    >
        <span v-if="sources.length > 0">© Data:</span>
        <span
            v-for="(source, index) in sources"
            :key="source.name"
            class="d-inline-flex"
        >
            <!--
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
            -->
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

<style scoped>
.map-footer-attribution {
    position: fixed;
    bottom: 3rem;
    left: 5rem;
    background-color: white;
    font-size: small;
    max-width: 200px;
}
</style>
