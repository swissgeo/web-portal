<!-- eslint multi-word: off-->
<script lang="ts" setup>
import type { SearchResult } from '@swissgeo/search'

import log from '@swissgeo/log'
import { useDatasetPanelStore } from '@swissgeo/skeleton'
import SideBar from '@/components/sidebar/SideBar.vue'

import DatasetPanel from '@/components/sidebar/DatasetPanel.vue'
import { useSearchSelection } from '@/composables/useSearchSelection'

const { resetApp } = useResetApp()
const route = useRoute()
const mapViewStore = useMapViewStore()
const localePath = useLocalePath()
const datasetPanelStore = useDatasetPanelStore()

const datasetDetailPath = computed(() => {
    if (!datasetPanelStore.activeDatasetId) {
        return undefined
    }
    return localePath(`/dataset/${datasetPanelStore.activeDatasetId}`)
})

const mapLayers = computed(() => mapViewStore.getMapLayers())
const isMapPage = computed(() => {
    const routeName = String(route.name ?? '')
    return route.path.includes('/map') || routeName.includes('map')
})

const isMapFullscreenMode = computed(() => isMapPage.value && mapViewStore.isFullscreenModeActive)

watch(route, (value) => {
    log.debug('route has changed', value.fullPath)

    if (!isMapPage.value && mapViewStore.isFullscreenModeActive) {
        mapViewStore.exitFullscreenMode()
    }
})

// Handle search result selection
const { handleResultSelection } = useSearchSelection()

async function onSearchResultSelected(result: SearchResult) {
    await handleResultSelection(result)
}
</script>

<template>
    <main
        ref="main"
        class="h-screen font-sans"
    >
        <div class="relative h-screen">
            <SideBar
                v-if="!isMapFullscreenMode"
                class="z-2"
                @search-result-selected="onSearchResultSelected"
                @reset-app="resetApp"
                :mapLayers="mapLayers"
            >
                <template #bottom-controls>
                    <div
                        class="pointer-events-auto"
                        v-if="!isMapFullscreenMode"
                    >
                        <SidebarLanguageSwitcherButton />
                    </div>
                </template>
            </SideBar>
            <div
                class="h-full w-full"
                :class="isMapFullscreenMode ? 'pl-0' : 'pl-20'"
            >
                <slot />
            </div>
            <DatasetPanel
                v-if="!isMapFullscreenMode"
                :detail-page-path="datasetDetailPath"
            />
        </div>
    </main>
</template>
