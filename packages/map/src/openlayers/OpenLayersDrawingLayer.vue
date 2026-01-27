<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import KML from 'ol/format/KML'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

import useOlDrawing from '@/composables/olDrawing.composable'
import { DrawingMode } from '@/stores/drawing'

const { layer } = defineProps<{
    layer: FileLayer
}>()

const drawingStore = useDrawingStore()
// Get the drawing manager from provided context (injected from main app)
// interface DrawingManager {
//     drawingMode: { value: 'point' | 'linestring' | 'polygon' | null }
//     isDrawing: { value: boolean }
//     featureCount: { value: number }
//     drawingFeatures: { value: any[] }
//     updateDrawingLayer: (features: any[]) => void
// }

// const drawingManager = inject<DrawingManager>('drawingManager')

if (!drawingStore) {
    console.error('Drawing manager not provided - drawing functionality will not work')
}
const {
    startDrawing: startOlDrawing,
    stopDrawing: stopOlDrawing,
    getFeatures,
    clearFeatures,
    addFeatures,
    setVisibility,
    setZIndex,
    updateFeatureText,
} = useOlDrawing(layer.humanId, layer.uuid, layer.opacity)

// Track if we've initialized features
const hasInitialized = ref(false)
let updateFeatureTimeout: ReturnType<typeof setTimeout> | null = null

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
            updateFeatureTimeout = null
        }, 150)
    }
}

// Function to save the edited text
const saveText = () => {
    if (editingTextFeature.value && editingText.value) {
        updateFeatureText(editingTextFeature.value, editingText.value)
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

// Watch for drawing mode changes from the manager
watch(
    () => drawingStore?.drawingMode,
    async (newMode: DrawingMode, oldMode: DrawingMode) => {
        console.log('🎨 Drawing mode watch triggered - from:', oldMode, 'to:', newMode)
        
        // if (newMode === null || newMode === undefined) {
        //     console.log('🛑 Stopping drawing - mode is null/undefined')
        //     // Explicitly stop the drawing interaction
        //     stopOlDrawing()
        //     // Update features when drawing stops
        //     updateFeatures()
        //     return
        // }

        if(newMode === DrawingMode.None) {
            console.log('🛑 Stopping drawing - mode is None')
            // Explicitly stop the drawing interaction
            clearDrawingFeatures()
            return
        }

        // Wait for next tick to ensure layer is fully initialized
        await nextTick()
        
        // Map the mode to OpenLayers geometry types
        const geometryType =
            newMode === DrawingMode.Point ? 'Point' : 
            newMode === DrawingMode.LineString ? 'LineString' : 
            newMode === DrawingMode.Text ? 'Text' :
            'Polygon'
        
        // Start drawing with callback to update features immediately
        startOlDrawing(geometryType, updateFeatures)
    },
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

function clearDrawingFeatures() {
    clearFeatures()
    stopOlDrawing()
}

// On mount, restore any existing features
onMounted(() => {
    console.log('OpenLayersDrawingLayer mounted', drawingStore.drawingFeatures.length)
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
                    featureProjection: 'EPSG:2056',
                    dataProjection: 'EPSG:4326',
                })
                if (features.length > 0) {
                    // Restore text property from name for text features
                    features.forEach(feature => {
                        const name = feature.get('name')
                        const text = feature.get('text')
                        // If we have a name but no text, and it's a Point, treat it as text
                        if (name && !text && feature.getGeometry()?.getType() === 'Point') {
                            feature.set('text', name)
                        }
                    })
                    
                    addFeatures(features)
                    drawingStore.drawingFeatures = features
                    drawingStore.updateDrawingLayer(features)
                }
            } catch (error) {
                console.error('Failed to parse existing KML data:', error)
            }
        }
        hasInitialized.value = true
    }
})

onUnmounted(() => {
    console.log('OpenLayersDrawingLayer unmounted')
    // Clean up drawing interactions
    clearDrawingFeatures()

})
</script>

<template>
    <slot />
    
    <!-- Text editing popup -->
    <div
        v-if="showTextPopup"
        class="fixed left-1/2 top-20 z-50 w-80 -translate-x-1/2 rounded-lg border border-gray-300 bg-white p-4 shadow-2xl"
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
