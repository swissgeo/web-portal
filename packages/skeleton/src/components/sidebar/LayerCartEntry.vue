<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import { useDrawingStore } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'
import { getDisplayNameFromTimestamp } from '@swissgeo/shared'
import { computed } from 'vue'

import IconButton from '@/components/IconButton.vue'
import { useDatasetPanelStore } from '@/stores/datasetPanel'

const { layer } = defineProps<{
    layer: Layer
}>()

const layerStore = useLayerStore()
const drawingStore = useDrawingStore()
const datasetPanelStore = useDatasetPanelStore()

const layersLength = computed(() => layerStore.layers.length)
const layerZIndex = computed(() => layerStore.getLayerZIndex(layer.uuid))

const displayName = computed(() => {
    // get the info from the dataset
    if (layer.info && layer.info.displayName) {
        return layer.info.displayName
    } else {
        return layer.humanId
    }
})

const currentTime = computed({
    get() {
        if (layer.dimensions?.time) {
            return layer.dimensions.time.currentValue
        } else {
            return null
        }
    },
    set(value) {
        layerStore.setDimension('time', layer.uuid, { currentValue: value })
    },
})

const availableTimes = computed(() => {
    if (layer.dimensions?.time) {
        return layer.dimensions.time.availableValues
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
    layerStore.moveLayerUp(layer.uuid)
}

function moveDown() {
    layerStore.moveLayerDown(layer.uuid)
}

function removeLayer() {
    layerStore.removeLayer(layer.uuid)
    if (layer.uuid === drawingStore.drawingKMLLayerUuid) {
        drawingStore.resetDrawingLayerUuid()
        drawingStore.clearDrawingFeatures()
    }
}

function openDatasetPanel() {
    datasetPanelStore.openDatasetPanel(layer.humanId)
}
</script>

<template>
    <li>
        <div class="flex">
            <IconButton
                :iconName="layer.isVisible ? 'Eye' : 'Eye-Off'"
                @click="toggleVisibility()"
                severity="secondary"
            />
            <div class="flex flex-col justify-between">
                <IconButton
                    :disabled="layerZIndex === layersLength - 1"
                    iconName="Chevron-Up"
                    severity="secondary"
                    class="h-0.5"
                    @click="moveUp()"
                ></IconButton>
                <IconButton
                    :disabled="layerZIndex === 0"
                    iconName="Chevron-Down"
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
                v-if="layer.type === 'dataset'"
                iconName="Info"
                severity="secondary"
                @click="openDatasetPanel"
            />
            <IconButton
                iconName="Trash"
                @click="removeLayer"
            />
        </div>
    </li>
</template>
