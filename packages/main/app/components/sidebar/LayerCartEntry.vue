<script lang="ts" setup>
// TODO : map view store alterations
import type { Layer as MapLayer } from '@swissgeo/map'

import { useDrawingStore } from '@swissgeo/drawing'
import { useLayerStore } from '@swissgeo/layers'
import { getDisplayNameFromTimestamp } from '@swissgeo/shared'
import { computed } from 'vue'

<<<<<<< HEAD
import IconButton from '@/components/IconButton.vue'
import { useDatasetPanelStore } from '@/stores/datasetPanel'

const { layer, index } = defineProps<{
    layer: Layer
    index: number
=======
const { layer, layerIndex } = defineProps<{
    layer: MapLayer
    layerIndex: number
>>>>>>> 795eee52 (GPS-583: map Layers handling)
}>()

const layerStore = useLayerStore()
const drawingStore = useDrawingStore()
const datasetPanelStore = useDatasetPanelStore()
const mapViewStore = useMapViewStore()
const bgLayerModifier = computed(() => (layerStore.backgroundLayer ? 1 : 0))

const layersLength = computed(() => mapViewStore.mapLayers.length)

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
        handleOpacityChange(value / 100)
        //layerStore.setOpacity(layerIndex, value / 100)
    },
})

function handleOpacityChange(value: number) {
    mapViewStore.updateLayerOpacity(layerIndex, value / 100)
}

function toggleVisibility() {
    mapViewStore.toggleVisibility(layerIndex)
}

function moveUp() {
    mapViewStore.moveLayerUp(layerIndex)
    layerStore.moveLayerUp(layerIndex - bgLayerModifier.value)
}

function moveDown() {
    mapViewStore.moveLayerDown(layerIndex)
    layerStore.moveLayerDown(layerIndex - bgLayerModifier.value)
}

function removeLayer() {
    mapViewStore.removeLayer(layerIndex)
    //layerStore.removeLayer(layerIndex - bgLayerModifier.value)
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
                    :disabled="layerIndex === layersLength - bgLayerModifier"
                    iconName="Chevron-Up"
                    severity="secondary"
                    class="h-0.5"
                    @click="moveUp()"
                ></IconButton>
                <IconButton
                    :disabled="layerIndex === bgLayerModifier"
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
                :title="layer.title"
                :class="{ 'text-gray-300': !layer.isVisible }"
            >
                {{ layer.displayName }}
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
