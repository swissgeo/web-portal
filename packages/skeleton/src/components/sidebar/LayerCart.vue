<script lang="ts" setup>
import { Layer, LayerType, useLayerStore } from '@swissgeo/layers'

const layerStore = useLayerStore()

function toggleVisibility(layer: Layer) {
    layerStore.toggleVisibility(layer.uuid)
}
</script>

<template>
    <ul class="mt-8">
        <li
            v-for="layer in layerStore.layers"
            class="flex items-center gap-2"
            :key="layer.uuid"
        >
            <div>
                <IconButton
                    :icon="layer.isVisible ? 'Eye' : 'EyeOff'"
                    @click="toggleVisibility(layer)"
                    severity="secondary"
                />
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
        </li>
    </ul>
</template>
