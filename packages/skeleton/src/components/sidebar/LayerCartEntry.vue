<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import { LayerType, useLayerStore } from '@swissgeo/layers'

import IconButton from '@/components/IconButton.vue'

const { layer } = defineProps<{
    layer: Layer
}>()

const layerStore = useLayerStore()

const layersLength = computed(() => layerStore.layers.length)

const displayName = computed(() => {
    if (layer.info && layer.info.displayName) {
        return layer.info.displayName
    } else {
        return layer.humanId
    }
})

function toggleVisibility() {
    layerStore.toggleVisibility(layer.uuid)
}

function moveUp() {
    layerStore.setLayerZIndex(layer, layer.zIndex + 1)
}

function moveDown() {
    layerStore.setLayerZIndex(layer, layer.zIndex - 1)
}

function removeLayer() {
    layerStore.removeLayer(layer.uuid)
}
</script>

<template>
    <li>
        <div class="flex">
            <IconButton
                :icon="layer.isVisible ? 'Eye' : 'EyeOff'"
                @click="toggleVisibility()"
                severity="secondary"
            />
            <div class="flex flex-col justify-between">
                <IconButton
                    :disabled="layer.zIndex === layersLength"
                    icon="ChevronUp"
                    severity="secondary"
                    class="h-0.5"
                    @click="moveUp()"
                ></IconButton>
                <IconButton
                    :disabled="layer.zIndex === 1"
                    icon="ChevronDown"
                    severity="secondary"
                    class="h-0.5"
                    @click="moveDown()"
                ></IconButton>
            </div>
        </div>
        <div
            class="overflow-x-hidden text-nowrap"
            :title="layer.humanId"
            :class="{ 'text-gray-300': !layer.isVisible }"
        >
            {{ displayName }}
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
            <IconButton
                icon="Trash"
                @click="removeLayer"
            />
        </div>
    </li>
</template>
