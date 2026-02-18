<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import { useDrawingStore } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'

import IconButton from '@/components/IconButton.vue'

import { getDisplayNameFromTimestamp } from '../../utils/timeUtils'

const { layer } = defineProps<{
    layer: Layer
}>()

const layerStore = useLayerStore()
const drawingStore = useDrawingStore()

const layersLength = computed(() => layerStore.layers.length)

const displayName = computed(() => {
    if (layer.info && layer.info.displayName) {
        return layer.info.displayName
    } else {
        return layer.humanId
    }
})

const currentTime = computed({
    get() {
        if (layer.dimensions && 'time' in layer.dimensions) {
            return layer.dimensions.time?.currentValue ?? null
        } else {
            return null
        }
    },
    set(value) {
        layerStore.setDimension('time', layer.uuid, { currentValue: value })
    },
})

const availableTimes = computed(() => {
    if (layer.dimensions && 'time' in layer.dimensions) {
        return layer.dimensions.time?.availableValues ?? []
    }
    return []
})

const getTimestampName = (time: string) => {
    return getDisplayNameFromTimestamp(time)
}

// Opacity as percentage (0-100) for the slider
const opacityPercent = computed({
    get: () => Math.round(layer.opacity * 100),
    set: (value: number) => {
        layerStore.setOpacity(layer.uuid, value / 100)
    },
})

function handleOpacityChange(value: number) {
    layerStore.setOpacity(layer.uuid, value / 100)
}

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
    if (layer.uuid === drawingStore.drawingKMLLayerUuid) {
        drawingStore.resetDrawingLayerUuid()
        drawingStore.clearDrawingFeatures()
    }
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
        <div class="flex-1">
            <div
                class="overflow-x-hidden text-nowrap"
                :title="layer.humanId"
                :class="{ 'text-gray-300': !layer.isVisible }"
            >
                {{ displayName }}
                <span
                    :class="{
                        'bg-amber-200': layer.type === 'wms',
                        'bg-fuchsia-200': layer.type === 'wmts',
                        'bg-emerald-200': layer.type === 'kml',
                        'bg-sky-200': layer.type === 'kmz',
                    }"
                >
                    ({{ layer.type }})</span
                >
            </div>
            <div class="mt-2 flex items-center gap-2">
                <span class="text-xs text-gray-600">Opacity:</span>
                <USlider
                    :model-value="opacityPercent"
                    @update:model-value="handleOpacityChange"
                    :min="0"
                    :max="100"
                    class="flex-1"
                />
                <span class="w-8 text-xs text-gray-600">{{ opacityPercent }}%</span>
            </div>
        </div>
        <div class="flex items-center">
            <div>
                <select
                    v-if="(availableTimes?.length || 0) > 1"
                    v-model="currentTime"
                    class="bg-zinc-300"
                >
                    <option
                        v-for="time in availableTimes"
                        :value="time"
                        :key="time"
                    >
                        {{ getTimestampName(time) }}
                    </option>
                </select>
            </div>
            <IconButton
                icon="Trash"
                @click="removeLayer"
            />
        </div>
    </li>
</template>
