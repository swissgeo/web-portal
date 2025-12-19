<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import { LayerType, useLayerStore } from '@swissgeo/layers'
import { cloneDeep } from 'lodash-es'

import IconButton from '@/components/IconButton.vue'

const layerStore = useLayerStore()

const sortedLayers = computed(() => {
    // sort is in-place, this would trigger a reactivity loop of death
    return cloneDeep(layerStore.layers)
        .sort((a, b) => a.zIndex - b.zIndex)
        .reverse()
})

function toggleVisibility(layer: Layer) {
    layerStore.toggleVisibility(layer.uuid)
}

function moveUp(layer: Layer) {
    layerStore.setLayerZIndex(layer, layer.zIndex + 1)
}

function moveDown(layer: Layer) {
    layerStore.setLayerZIndex(layer, layer.zIndex - 1)
}
</script>

<template>
    <ul class="mt-8 flex flex-col gap-4">
        <li
            v-for="layer in sortedLayers"
            class="flex items-center gap-2"
            :key="layer.uuid"
        >
            <div class="flex">
                <IconButton
                    :icon="layer.isVisible ? 'Eye' : 'EyeOff'"
                    @click="toggleVisibility(layer)"
                    severity="secondary"
                />
                <div class="flex flex-col justify-between">
                    <IconButton
                        :disabled="layer.zIndex === sortedLayers.length"
                        icon="ChevronUp"
                        severity="secondary"
                        class="h-0.5"
                        @click="moveUp(layer)"
                    ></IconButton>
                    <IconButton
                        :disabled="layer.zIndex === 1"
                        icon="ChevronDown"
                        severity="secondary"
                        class="h-0.5"
                        @click="moveDown(layer)"
                    ></IconButton>
                </div>
            </div>
            <div
                class="overflow-x-hidden text-nowrap"
                :title="layer.record.id"
                :class="{ 'text-gray-300': !layer.isVisible }"
            >
                {{ layer.record.id }}
                <span
                    :class="{
                        'bg-amber-200': layer.type === LayerType.WMS,
                        'bg-fuchsia-200': layer.type === LayerType.WMTS,
                    }"
                >
                    ({{ layer.type }})</span
                >
            </div>
            <div>
                <IconButton icon="Trash" />
            </div>
        </li>
    </ul>
</template>
