<script setup lang="ts">
import type { Map as OlMap } from 'ol'
import type { Ref } from 'vue'

import Overlay from 'ol/Overlay'
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import usePositionStore from '@/stores/position'

import { useOlMapContextMenu } from '../composables/useOlMapContextMenu.composable'
import OpenLayersContextMenuPopupPosition from './OpenLayersContextMenuPopupPosition.vue'
import OpenLayersContextMenuPopupShare from './OpenLayersContextMenuPopupShare.vue'

const olMap = inject<Ref<OlMap | undefined>>('olMap')
const { isVisible, coordinate, close } = useOlMapContextMenu()
const positionStore = usePositionStore()
const { t } = useI18n()

const popupEl = ref<HTMLDivElement>()
let overlay: Overlay | null = null

const isCollapsed = ref(false)

const tabs = computed(() => [
    { label: t('map.contextMenuPopup.tabPosition'), slot: 'position' as const },
    { label: t('map.contextMenuPopup.tabShare'), slot: 'share' as const },
])

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
        isCollapsed.value = false
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
        class="w-96"
    >
        <div
            v-if="isVisible"
            class="overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-gray-200"
            @click.stop
        >
            <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                <span class="text-sm font-semibold text-gray-800">{{
                    t('map.contextMenuPopup.title')
                }}</span>
                <div class="flex items-center gap-1">
                    <UButton
                        :icon="isCollapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'"
                        color="neutral"
                        variant="ghost"
                        square
                        size="xs"
                        @click="isCollapsed = !isCollapsed"
                    />
                    <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        square
                        size="xs"
                        @click="close"
                    />
                </div>
            </div>

            <div v-if="!isCollapsed">
                <UTabs
                    :items="tabs"
                    variant="link"
                    size="sm"
                    :unmount-on-hide="false"
                >
                    <template #position>
                        <OpenLayersContextMenuPopupPosition
                            :coordinate="coordinate"
                            :projection="positionStore.projection"
                        />
                    </template>
                    <template #share>
                        <OpenLayersContextMenuPopupShare />
                    </template>
                </UTabs>
            </div>
        </div>
    </div>
</template>
