<!-- eslint multi-word: off-->
<script lang="ts" setup>
import type { SearchResult } from '@swissgeo/search'

import log from '@swissgeo/log'
import { SideBar } from '@swissgeo/skeleton'

import { useSearchSelection } from '@/composables/useSearchSelection'

const route = useRoute()
const mapViewStore = useMapViewStore()

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
        class="font-sans"
    >
        <div class="relative h-screen">
            <SideBar
                v-if="!isMapFullscreenMode"
                class="z-2"
                @search-result-selected="onSearchResultSelected"
                :mapLayers=""
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
        </div>
    </main>
</template>
