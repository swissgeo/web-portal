<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import {
    useOlDrawing,
    EPSG_2056_CH1903,
    EPSG_4326_WGS84,
    DrawingMode,
    useDrawingStore,
    getMarkerIconById,
} from '@swissgeo/drawing'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import KML from 'ol/format/KML'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'

const { layer } = defineProps<{
    layer: FileLayer
}>()

const drawingStore = useDrawingStore()

const {
    startDrawing: startOlDrawing,
    stopDrawing: stopOlDrawing,
    getFeatures,
    clearFeatures,
    addFeatures,
    setVisibility,
    setZIndex,
    updateFeatureText,
    setSelectedIcon,
} = useOlDrawing(layer.humanId, layer.uuid, layer.opacity)

// Track if we've initialized features
const hasInitialized = ref(false)
let updateFeatureTimeout: ReturnType<typeof setTimeout> | undefined

// Text editing state
const editingTextFeature = ref<Feature<Geometry> | undefined>(undefined)
const editingText = ref('')
const showTextPopup = ref(false)

// Function to update features - only updates the feature array for UI display
// KML conversion/save happens only when closing the drawing panel
const updateFeatures = (feature?: Feature<Geometry>) => {
    if (drawingStore) {
        // Clear any pending update
        if (updateFeatureTimeout) {
            clearTimeout(updateFeatureTimeout)
        }

        // If this is a text feature, show the popup for editing
        if (feature && feature.get('text')) {
            editingTextFeature.value = feature
            editingText.value = feature.get('text') || 'New Text'
            showTextPopup.value = true
        }

        // Debounce updates to reduce reactive overhead
        updateFeatureTimeout = setTimeout(() => {
            const features = getFeatures()
            // Only update the feature array in store for UI display (feature count)
            // Don't trigger KML conversion until drawing panel is closed
            if (features.length !== drawingStore.drawingFeatures.length) {
                drawingStore.drawingFeatures = features
            }
            updateFeatureTimeout = undefined
        }, 150)
    }
}

// Function to save the edited text
const saveText = () => {
    if (editingTextFeature.value && editingText.value) {
        updateFeatureText(editingTextFeature.value as Feature<Geometry>, editingText.value)
        updateFeatures()
    }
    showTextPopup.value = false
    editingTextFeature.value = undefined
    editingText.value = ''
}

const cancelTextEdit = () => {
    showTextPopup.value = false
    editingTextFeature.value = undefined
    editingText.value = ''
}

const clearDrawingFeatures = () => {
    clearFeatures()
    stopOlDrawing()
}

// Watch for drawing mode changes from the manager
watch(
    () => drawingStore?.drawingMode,
    async (newMode: DrawingMode) => {
        if (newMode === 'None') {
            // Explicitly stop the drawing interaction
            clearDrawingFeatures()
            return
        }

        // Wait for next tick to ensure layer is fully initialized
        await nextTick()

        // Start drawing with callback to update features immediately
        startOlDrawing(newMode, updateFeatures)
    }
)

// Watch for visibility changes
watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

// Watch for zIndex changes
watch(
    () => layer.zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

// Watch for clear action
watch(
    () => drawingStore?.featureCount,
    (newCount, oldCount) => {
        // If count went to 0 from a higher number, clear the features
        if (newCount === 0 && oldCount > 0) {
            clearDrawingFeatures()
        }
    }
)

// Watch for icon selection changes
watch(
    () => drawingStore?.selectedIconId,
    (newIconId) => {
        if (newIconId) {
            const icon = getMarkerIconById(newIconId)
            if (icon) {
                setSelectedIcon(icon)
            }
        }
    }
)

// On mount, restore any existing features
onMounted(() => {
    if (!hasInitialized.value) {
        // First check if we have features in the drawing manager
        if (drawingStore.drawingFeatures.length > 0) {
            addFeatures(drawingStore.drawingFeatures)
            hasInitialized.value = true
            return
        }

        // Otherwise, try to parse any existing KML data from the layer
        if (layer.fileData) {
            try {
                register(proj4)
                const format = new KML({
                    extractStyles: true,
                })
                const features = format.readFeatures(layer.fileData, {
                    featureProjection: EPSG_2056_CH1903,
                    dataProjection: EPSG_4326_WGS84,
                })
                if (features.length > 0) {
                    // Restore text property from name for text features
                    // Also preserve iconId if it exists
                    features.forEach((feature) => {
                        const name = feature.get('name')
                        const text = feature.get('text')
                        const iconId = feature.get('iconId')

                        // If we have a name but no text, and it's a Point, treat it as text
                        if (name && !text && feature.getGeometry()?.getType() === 'Point') {
                            feature.set('text', name)
                        }

                        // Preserve iconId if present
                        if (iconId) {
                            feature.set('iconId', iconId)
                        }
                    })

                    addFeatures(features)
                    drawingStore.drawingFeatures = features
                }
            } catch (error) {
                log.error({
                    title: 'OpenLayersDrawingLayer',
                    titleColor: LogPreDefinedColor.Red,
                    messages: ['Failed to parse existing KML data', error],
                })
            }
        }
        hasInitialized.value = true
    }
})

onUnmounted(() => {
    // Clean up drawing interactions
    clearDrawingFeatures()
})
</script>

<template>
    <slot />

    <!-- Text editing popup -->
    <div
        v-if="showTextPopup"
        class="fixed top-20 left-1/2 z-50 w-80 -translate-x-1/2 rounded-lg border border-gray-300 bg-white p-4 shadow-2xl"
    >
        <h3 class="mb-3 text-base font-semibold">Edit Text</h3>
        <input
            v-model="editingText"
            type="text"
            class="mb-3 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Enter text..."
            @keyup.enter="saveText"
            @keyup.esc="cancelTextEdit"
            autofocus
        />
        <div class="flex justify-end gap-2">
            <button
                @click="cancelTextEdit"
                class="rounded bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
            >
                Cancel
            </button>
            <button
                @click="saveText"
                class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
            >
                Save
            </button>
        </div>
    </div>
</template>
