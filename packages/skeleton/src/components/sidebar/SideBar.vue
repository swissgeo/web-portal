<script lang="ts" setup>
import LogoPic from '@/components/LogoPic.vue'
import SidebarIcons from '@/components/sidebar/SidebarIcons.vue'
import { useUiStore, SidebarType } from '@/stores/ui'

import LayerCart from './LayerCart.vue'
// TEMPORARY: For testing SearchResults
import SearchResultsTest from './search/SearchResultsTest.vue'

const uiStore = useUiStore()

function resetApp() {}

// used for the dragging thing
const sidebarSecondColumnWidth = 400
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
                </div>
                <!-- Second column -->
                <div
                    v-show="uiStore.isSidebarOpen"
                    :style="{ width: sidebarSecondColumnWidth + 'px' }"
                    class="relative flex h-full bg-white transition-[width] duration-75 ease-out"
                >
                    <LayerCart v-if="uiStore.currentSidebar === SidebarType.LAYER_CART"></LayerCart>
                    <!-- TEMPORARY: Test SearchResults -->
                    <SearchResultsTest
                        v-if="uiStore.currentSidebar === SidebarType.SEARCH"
                    ></SearchResultsTest>
                </div>
            </div>
        </div>
    </div>
</template>
