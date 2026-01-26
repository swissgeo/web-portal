<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import KML from 'ol/format/KML'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

import useOlDrawing from '../composables/olDrawing.composable'

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
} = useOlDrawing(layer.humanId, layer.uuid, layer.opacity)

// Track if we've initialized features
const hasInitialized = ref(false)
let updateFeatureTimeout: ReturnType<typeof setTimeout> | null = null

// Function to update features - only updates the feature array for UI display
// KML conversion/save happens only when closing the drawing panel
const updateFeatures = () => {
    if (drawingStore) {
        // Clear any pending update
        if (updateFeatureTimeout) {
            clearTimeout(updateFeatureTimeout)
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

// Watch for drawing mode changes from the manager
watch(
    () => drawingStore?.drawingMode,
    async (newMode, oldMode) => {
        console.log('🎨 Drawing mode watch triggered - from:', oldMode, 'to:', newMode)
        
        if (newMode === null || newMode === undefined) {
            console.log('🛑 Stopping drawing - mode is null/undefined')
            // Explicitly stop the drawing interaction
            stopOlDrawing()
            // Update features when drawing stops
            updateFeatures()
            return
        }

        // Wait for next tick to ensure layer is fully initialized
        await nextTick()
        
        // Map the mode to OpenLayers geometry types
        const geometryType =
            newMode === 'point' ? 'Point' : newMode === 'linestring' ? 'LineString' : 'Polygon'
        
        console.log('✏️ Starting drawing with geometry type:', geometryType)
        // Start drawing with callback to update features immediately
        startOlDrawing(geometryType, updateFeatures)
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
    () => drawingStore?.featureCount?.value,
    (newCount, oldCount) => {
        // If count went to 0 from a higher number, clear the features
        if (newCount === 0 && oldCount > 0) {
            clearFeatures()
        }
    }
)

// On mount, restore any existing features
onMounted(() => {
    console.log('OpenLayersDrawingLayer mounted')
    console.log('OpenLayersDrawingLayer mounted2', drawingStore.drawingFeatures.length)
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
    // stopOlDrawing()
})
</script>

<template>
    <slot />
</template>
