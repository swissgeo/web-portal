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
    if (layer.dimensions && 'time' in layer.dimensions) {
        return layer.dimensions.time.availableValues
    }
    return []
})

const getTimestampName = (time: string) => {
    return getDisplayNameFromTimestamp(time)
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
