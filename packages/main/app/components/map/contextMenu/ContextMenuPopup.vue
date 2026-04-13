<script setup lang="ts">
import { OpenLayersContextMenuPopup, useOlMapContextMenu, usePositionStore } from '@swissgeo/map'
import { useI18n } from 'vue-i18n'

const { isVisible, coordinate, close } = useOlMapContextMenu()
const positionStore = usePositionStore()
const { t } = useI18n()

const isCollapsed = ref(false)

const tabs = computed(() => [
    { label: t('map.contextMenuPopup.tabPosition'), slot: 'position' as const },
    { label: t('map.contextMenuPopup.tabShare'), slot: 'share' as const },
])

watch(isVisible, (visible) => {
    if (visible) {
        isCollapsed.value = false
    }
})
</script>

<template>
    <OpenLayersContextMenuPopup>
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
                        <MapContextMenuPopupPosition
                            :coordinate="coordinate"
                            :projection="positionStore.projection"
                        />
                    </template>
                    <template #share>
                        <MapContextMenuPopupShare />
                    </template>
                </UTabs>
            </div>
        </div>
    </OpenLayersContextMenuPopup>
</template>
