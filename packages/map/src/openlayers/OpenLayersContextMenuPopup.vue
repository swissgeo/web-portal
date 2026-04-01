<script setup lang="ts">
import type { Map as OlMap } from 'ol'
import type { Ref } from 'vue'

import { ChevronDown, ChevronUp, X } from 'lucide-vue-next'
import Overlay from 'ol/Overlay'
import { inject, ref, watch, onMounted, onUnmounted } from 'vue'

import usePositionStore from '@/stores/position'

import { useMapContextMenu } from '../composables/useOlMapContextMenu.composable'
import OpenLayersContextMenuPopupPosition from './OpenLayersContextMenuPopupPosition.vue'
import OpenLayersContextMenuPopupShare from './OpenLayersContextMenuPopupShare.vue'

const olMap = inject<Ref<OlMap | undefined>>('olMap')
const { isVisible, coordinate, close } = useMapContextMenu()
const positionStore = usePositionStore()

const popupEl = ref<HTMLDivElement>()
let overlay: Overlay | null = null

const isCollapsed = ref(false)
const activeTab = ref<'position' | 'share'>('position')

const tabs: { label: string; value: 'position' | 'share' }[] = [
    { label: 'Position', value: 'position' },
    { label: 'Share Position', value: 'share' },
]

onMounted(() => {
    overlay = new Overlay({
        element: popupEl.value,
        positioning: 'top-center',
        offset: [0, 10],
        stopEvent: true,
    })
    watch(
        () => olMap?.value,
        (map) => {
            if (map) {
                map.addOverlay(overlay!)
            }
        },
        { immediate: true }
    )
})

watch([isVisible, coordinate], ([visible, coord]) => {
    if (visible && coord) {
        overlay?.setPosition(coord)
    } else {
        overlay?.setPosition(undefined)
    }
})

onUnmounted(() => olMap?.value?.removeOverlay(overlay!))
</script>

<template>
    <div
        ref="popupEl"
        class="w-100"
    >
        <div
            v-if="isVisible"
            class="overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-gray-200"
            @click.stop
        >
            <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                <span class="text-sm font-semibold text-gray-800">Position</span>
                <div class="flex items-center gap-1">
                    <button
                        class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        @click="isCollapsed = !isCollapsed"
                    >
                        <ChevronUp
                            v-if="!isCollapsed"
                            :size="14"
                        />
                        <ChevronDown
                            v-else
                            :size="14"
                        />
                    </button>
                    <button
                        class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        @click="close"
                    >
                        <X :size="14" />
                    </button>
                </div>
            </div>

            <div v-if="!isCollapsed">
                <div class="flex border-b border-gray-200">
                    <button
                        v-for="tab in tabs"
                        :key="tab.value"
                        class="px-4 py-2 text-sm font-medium transition-colors"
                        :class="
                            activeTab === tab.value
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-800'
                        "
                        @click="activeTab = tab.value"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <OpenLayersContextMenuPopupPosition
                    v-if="activeTab === 'position'"
                    :coordinate="coordinate"
                    :projection="positionStore.projection"
                />
                <OpenLayersContextMenuPopupShare
                    v-else
                    :coordinate="coordinate"
                />
            </div>
        </div>
    </div>
</template>
