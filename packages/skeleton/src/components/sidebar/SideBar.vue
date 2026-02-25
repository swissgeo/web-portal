<script lang="ts" setup>
import type { SearchResult } from '@swissgeo/search'

import LogoPic from '@/components/LogoPic.vue'
import LayerCart from '@/components/sidebar/LayerCart.vue'
import SearchPanel from '@/components/sidebar/search/SearchPanel.vue'
import SidebarIcons from '@/components/sidebar/SidebarIcons.vue'
import { useSidebarStore, SidebarType, SIDEBAR_CONTENT_WIDTH } from '@/stores/ui'

import BuildInfoButton from './BuildInfoButton.vue'

const uiStore = useSidebarStore()

const emit = defineEmits<{
    'search-result-selected': [result: SearchResult]
}>()

defineSlots<{
    'bottom-controls'?: () => unknown
}>()

function resetApp() {}

function handleSearchResultSelected(result: SearchResult) {
    emit('search-result-selected', result)
}

// used for the dragging thing
const sidebarSecondColumnWidth = SIDEBAR_CONTENT_WIDTH
</script>

<template>
    <div class="absolute top-0 left-0 flex h-screen w-auto min-w-12 shadow-lg">
        <div class="flex flex-col">
            <div class="flex shrink-0 justify-center bg-white">
                <LogoPic
                    class="h-12"
                    @logo-click="resetApp"
                    :condensed="!uiStore.isSidebarOpen"
                />
            </div>
            <div class="flex min-h-0 w-full flex-1 flex-row border-t border-neutral-100 p-0">
                <!-- First column -->
                <div class="flex h-full min-w-16 flex-col items-center justify-between pt-4">
                    <div class="flex flex-col items-center gap-2">
                        <SidebarIcons></SidebarIcons>
                    </div>
                    <div class="flex flex-col items-center gap-2">
                        <BuildInfoButton></BuildInfoButton>
                    </div>
                </div>
                <!-- Second column -->
                <div
                    v-show="uiStore.isSidebarOpen"
                    :style="{ width: sidebarSecondColumnWidth + 'px' }"
                    class="relative flex h-full bg-white transition-[width] duration-75 ease-out"
                >
                    <LayerCart v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"></LayerCart>
                    <SearchPanel
                        v-if="uiStore.currentSidebar === SidebarType.SEARCH"
                        @result-selected="handleSearchResultSelected"
                    ></SearchPanel>
                </div>
            </div>
        </div>
    </div>
</template>
