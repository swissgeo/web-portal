<script setup lang="ts">
import { type ServerLayer, LayerType, makeServerLayer } from '@swissgeo/layers'
//import type { ActionDispatcher } from '@/store/types'
//import BackgroundSelectorWheelRounded from '@/modules/map/components/footer/backgroundSelector/BackgroundSelectorWheelRounded.vue'
import { useLayerStore } from '@swissgeo/layers'

import type { VoidLayer } from '@/composables/useBackgroundSelector'

// import useUIStore from '@/store/modules/ui'
// const dispatcher: ActionDispatcher = { name: 'BackgroundSelector.vue' }
import BackgroundSelectorSquared from '@/BackgroundSelectorSquared.vue'

const layerStore = useLayerStore()
// const uiStore = useUIStore()

function generateBackgroundCategories(bg: Layer) {
    return {
        farbe: bg.id.indexOf('farbe') !== -1,
        grau: bg.id.indexOf('grau') !== -1,
        get aerial() {
            return !this.farbe && !this.grau
        },
    }
}

/** Sorted backgrounds so that they are ordered such as [ void, grau, farbe, aerial ] */
const sortedBackgroundLayersWithVoid = computed<(ServerLayer | VoidLayer)[]>(() => [
    'void',
    makeServerLayer(LayerType.WMTS, {
        geocatId: '',
        id: 'ch.swisstopo.pixelkarte-farbe',
        language: {
            code: 'en',
            dir: 'ltr',
            name: 'English',
        },
        links: [
            {
                protocol: 'OGC:WMTS',
                href: 'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml?lang=de',
                title: 'WMTS',
                type: 'image/png',
            },
        ],
        properties: {
            attribution: '',
            contacts: [],
            description: '',
            title: '',
            type: '',
        },
    }),
    makeServerLayer(LayerType.WMTS, {
        geocatId: '',
        id: 'ch.swisstopo.pixelkarte-grau',
        language: {
            code: 'en',
            dir: 'ltr',
            name: 'English',
        },
        links: [
            {
                protocol: 'OGC:WMTS',
                href: 'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml?lang=de',
                title: 'WMTS',
                type: 'image/png',
            },
        ],
        properties: {
            attribution: '',
            contacts: [],
            description: '',
            title: '',
            type: '',
        },
    }),
    makeServerLayer(LayerType.WMTS, {
        geocatId: '',
        id: 'ch.swisstopo.swissimage',
        language: {
            code: 'en',
            dir: 'ltr',
            name: 'English',
        },
        links: [
            {
                protocol: 'OGC:WMTS',
                href: 'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml?lang=de',
                title: 'WMTS',
                type: 'image/png',
            },
        ],
        properties: {
            attribution: '',
            contacts: [],
            description: '',
            title: '',
            type: '',
        },
    }),
])

function selectBackground(backgroundLayer: ServerLayer | VoidLayer) {
    // TODO HAAAAACK
    if (backgroundLayer === 'void') {
        layerStore.setBackground(null)
    }
    layerStore.setBackground(backgroundLayer /*, dispatcher*/)
}
</script>

<template>
    <BackgroundSelectorSquared
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layerStore.backgroundLayer"
        @select-background="selectBackground"
    />
    <!-- <BackgroundSelectorWheelRounded
        v-else
        :background-layers="sortedBackgroundLayersWithVoid"
        :current-background-layer="layersStore.currentBackgroundLayer"
        @select-background="selectBackground"
    /> -->
</template>
