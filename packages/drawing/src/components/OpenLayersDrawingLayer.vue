<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { EPSG_4326_WGS84, EPSG_2056_CH1903 } from '@swissgeo/shared'
import KML from 'ol/format/KML'
import { register } from 'ol/proj/proj4'
import proj4 from 'proj4'
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import type { DrawingHoverHintPayload, DrawingMode } from '@/types'

import { useOlDrawing } from '@/composables/olDrawing.composable'
import { useDrawingStore } from '@/stores/drawing'
import { getMarkerIconById } from '@/utils/markerIcons'

const { layer, zIndex } = defineProps<{
    layer: Layer
    zIndex: number
}>()

const drawingStore = useDrawingStore()
const { t } = useI18n()

const {
    startDrawing: startOlDrawing,
    stopDrawing: stopOlDrawing,
    enableActiveEditing,
    disableActiveEditing,
    getFeatures,
    clearFeatures,
    addFeatures,
    setVisibility,
    setZIndex,
    setSelectedIcon,
    enablePassiveInspection,
    disablePassiveInspection,
} = useOlDrawing(layer.humanId, layer.uuid, layer.opacity, {
    translate: (key, params) => t(key, params ?? {}),
})

// Track if we've initialized features
const hasInitialized = ref(false)
let updateFeatureTimeout: ReturnType<typeof setTimeout> | undefined

const showHoverHint = ref(false)
const hoverHintText = ref('')
const hoverHintX = ref(0)
const hoverHintY = ref(0)

// Function to update features - only updates the feature array for UI display
// KML conversion/save happens only when closing the drawing panel
const updateFeatures = (_feature?: Feature<Geometry>) => {
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
            updateFeatureTimeout = undefined
        }, 150)
    }
}

const clearDrawingFeatures = () => {
    clearFeatures()
    stopOlDrawing()
}

const applyInteractionState = async (isDrawingEnabled: boolean, mode: DrawingMode) => {
    // Ensure interactions are switched atomically when mode/state toggles
    stopOlDrawing()
    disableActiveEditing()
    disablePassiveInspection()
    if (!isDrawingEnabled || mode === 'None') {
        showHoverHint.value = false
        enablePassiveInspection(
            (payload) => {
                drawingStore.setSelectedFeatureId(payload?.featureId ?? null)
                drawingStore.setSelectedFeatureInfo(payload)
            },
            (hoverHintPayload: DrawingHoverHintPayload | null) => {
                if (!hoverHintPayload) {
                    showHoverHint.value = false
                    return
                }

                hoverHintText.value = hoverHintPayload.text
                hoverHintX.value = hoverHintPayload.x
                hoverHintY.value = hoverHintPayload.y
                showHoverHint.value = true
            }
        )
        enableActiveEditing()
        return
    }

    showHoverHint.value = false
    drawingStore.clearPassiveSelection()

    // Wait for next tick to ensure layer is fully initialized
    await nextTick()
    startOlDrawing(mode, (feature) => {
        updateFeatures(feature)
        drawingStore.setDrawingMode('None')
    })
}

// Watch for active/passive interaction changes from the manager
watch(
    () => [drawingStore?.isDrawing, drawingStore?.drawingMode] as const,
    async ([isDrawingEnabled, newMode]) => {
        await applyInteractionState(Boolean(isDrawingEnabled), newMode)
    },
    {
        immediate: true,
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
    () => zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    },
    {
        immediate: true,
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

onMounted(() => {
    restoreFeatures()
})

onUnmounted(() => {
    // Clean up drawing interactions
    clearDrawingFeatures()
    disableActiveEditing()
    disablePassiveInspection()
    showHoverHint.value = false
})

function restoreFeatures() {
    if (!hasInitialized.value) {
        if (layer.info?.displayName) {
            drawingStore.setDrawingName(layer.info.displayName)
        }

        // First check if we have features in the drawing manager
        if (drawingStore.drawingFeatures.length > 0) {
            addFeatures(drawingStore.drawingFeatures as Feature<Geometry>[])
            hasInitialized.value = true
            return
        }

        // Otherwise, try to parse any existing KML data from the layer
        if (layer.data && typeof layer.data === 'string') {
            try {
                const metadataDrawingName = drawingStore.extractDrawingNameFromKML(layer.data)
                if (metadataDrawingName) {
                    drawingStore.setDrawingName(metadataDrawingName)
                }

                register(proj4)
                const format = new KML({
                    extractStyles: true,
                })
                const features = format.readFeatures(layer.data, {
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
}
</script>

<template>
    <slot />

    <!-- Teleport to body so position:fixed works relative to the browser window, not OL's transformed viewport -->
    <Teleport to="body">
        <div
            v-if="showHoverHint"
            :style="{
                position: 'fixed',
                left: `${hoverHintX}px`,
                top: `${hoverHintY}px`,
                zIndex: '9997',
                backgroundColor: 'rgba(55, 65, 81, 0.92)',
                color: '#ffffff',
            }"
            class="pointer-events-none rounded px-2 py-1 text-xs"
        >
            {{ hoverHintText }}
        </div>
    </Teleport>
</template>
