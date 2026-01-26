<script lang="ts" setup>
import type { FileLayer } from '@swissgeo/layers'

import KML from 'ol/format/KML'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'

import useOlDrawing from '../composables/olDrawing.composable'

const { layer } = defineProps<{
    layer: FileLayer
}>()

// Get the drawing manager from provided context (injected from main app)
interface DrawingManager {
    drawingMode: { value: 'point' | 'linestring' | 'polygon' | null }
    isDrawing: { value: boolean }
    featureCount: { value: number }
    drawingFeatures: { value: any[] }
    updateDrawingLayer: (features: any[]) => void
}

const drawingManager = inject<DrawingManager>('drawingManager')

if (!drawingManager) {
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

// Function to update features
const updateFeatures = () => {
    if (drawingManager) {
        const features = getFeatures()
        drawingManager.drawingFeatures.value = features
        drawingManager.updateDrawingLayer(features)
    }
}

// Watch for drawing mode changes from the manager
watch(
    () => drawingManager?.drawingMode?.value,
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
    () => drawingManager?.featureCount?.value,
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
    if (!hasInitialized.value && drawingManager) {
        // First check if we have features in the drawing manager
        if (drawingManager.drawingFeatures.value.length > 0) {
            addFeatures(drawingManager.drawingFeatures.value)
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
                    drawingManager.drawingFeatures.value = features
                    drawingManager.updateDrawingLayer(features)
                }
            } catch (error) {
                console.error('Failed to parse existing KML data:', error)
            }
        }
        hasInitialized.value = true
    }
})
</script>

<template>
    <slot />
</template>
