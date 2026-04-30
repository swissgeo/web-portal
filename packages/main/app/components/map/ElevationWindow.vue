<script setup lang="ts">
import type { LineString } from 'geojson'
import type { Feature } from 'ol'
import type { LineString as OlLineString, Polygon as OlPolygon, Geometry } from 'ol/geom'

import { useDrawingStore, resolveFeatureId } from '@swissgeo/drawing'
import { X } from 'lucide-vue-next'
import GeoJSON from 'ol/format/GeoJSON'
import { computed, nextTick, onBeforeUnmount, onBeforeMount, reactive, ref, watch } from 'vue'

const drawingStore = useDrawingStore()
const { t } = useI18n()
const windowRef = ref<HTMLElement | null>(null)
const olGeoJSON = new GeoJSON()
const geometryRevision = ref(0)

const WINDOW_MARGIN = 16
const position = reactive({
    x: WINDOW_MARGIN,
    y: WINDOW_MARGIN,
    initialized: false,
})
const dragState = reactive({
    active: false,
    offsetX: 0,
    offsetY: 0,
})

const hasInfo = computed(() => drawingStore.isDrawing && Boolean(drawingStore.selectedFeatureInfo))

let unlistenGeometryChange: (() => void) | null = null

watch(
    () => drawingStore.selectedFeatureId,
    (selectedId) => {
        unlistenGeometryChange?.()
        unlistenGeometryChange = null

        if (!selectedId) {
            return
        }

        const features = drawingStore.drawingFeatures as Feature<Geometry>[]
        const feature = features.find((f) => resolveFeatureId(f) === selectedId)
        if (!feature) {
            return
        }

        const key = feature.on('change', () => {
            geometryRevision.value++
        })
        unlistenGeometryChange = () => feature.un('change', key.listener)
    },
    { immediate: true }
)

const selectedLineString = computed<LineString | null>(() => {
    void geometryRevision.value

    const selectedId = drawingStore.selectedFeatureId
    if (!selectedId) {
        return null
    }

    const features = drawingStore.drawingFeatures as Feature<Geometry>[]
    const feature = features.find((f) => resolveFeatureId(f) === selectedId) ?? null
    const geometry = feature?.getGeometry()
    const type = geometry?.getType()

    if (type === 'LineString') {
        return olGeoJSON.writeGeometryObject(geometry as OlLineString) as LineString
    }

    if (type === 'Polygon') {
        const ring = (geometry as OlPolygon).getLinearRing(0)
        if (!ring) {
            return null
        }
        const coords = ring.getCoordinates()
        return { type: 'LineString', coordinates: coords }
    }

    return null
})

const { elevationProfile, elevationPending } = useElevationProfile(selectedLineString)

function clampToViewport(nextX: number, nextY: number) {
    if (typeof window === 'undefined') {
        return { x: nextX, y: nextY }
    }

    const element = windowRef.value
    const width = element?.offsetWidth ?? 384
    const height = element?.offsetHeight ?? 220
    const maxX = Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN)
    const maxY = Math.max(WINDOW_MARGIN, window.innerHeight - height - WINDOW_MARGIN)

    return {
        x: Math.min(Math.max(nextX, WINDOW_MARGIN), maxX),
        y: Math.min(Math.max(nextY, WINDOW_MARGIN), maxY),
    }
}

async function ensureInitialPosition() {
    if (position.initialized) {
        return
    }

    await nextTick()

    if (typeof window === 'undefined') {
        position.initialized = true
        return
    }

    // const element = windowRef.value
    // const width = element?.offsetWidth ?? 384
    const initial = clampToViewport(WINDOW_MARGIN, WINDOW_MARGIN)
    position.x = initial.x
    position.y = initial.y
    position.initialized = true
}

function onDragMove(event: PointerEvent) {
    if (!dragState.active) {
        return
    }

    const clamped = clampToViewport(
        event.clientX - dragState.offsetX,
        event.clientY - dragState.offsetY
    )
    position.x = clamped.x
    position.y = clamped.y
}

function stopDrag() {
    if (!dragState.active || typeof window === 'undefined') {
        return
    }

    dragState.active = false
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', stopDrag)
    window.removeEventListener('pointercancel', stopDrag)
}

function startDrag(event: PointerEvent) {
    if (event.button !== 0 || !windowRef.value || typeof window === 'undefined') {
        return
    }

    const rect = windowRef.value.getBoundingClientRect()
    dragState.active = true
    dragState.offsetX = event.clientX - rect.left
    dragState.offsetY = event.clientY - rect.top

    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
}

function handleWindowResize() {
    const clamped = clampToViewport(position.x, position.y)
    position.x = clamped.x
    position.y = clamped.y
}

watch(
    hasInfo,
    async (visible) => {
        if (!visible) {
            return
        }

        await ensureInitialPosition()
        handleWindowResize()
    },
    { immediate: true }
)

onBeforeMount(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleWindowResize)
    }
})

onBeforeUnmount(() => {
    stopDrag()
    unlistenGeometryChange?.()
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleWindowResize)
    }
})

function closeWindow() {
    drawingStore.clearPassiveSelection()
}
</script>

<template>
    <div
        ref="windowRef"
        v-if="hasInfo && selectedLineString"
        class="fixed z-9998 w-96"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
        <UCard class="shadow-lg">
            <template #header>
                <div
                    class="flex items-center justify-between select-none"
                    :class="dragState.active ? 'cursor-grabbing' : 'cursor-grab'"
                    @pointerdown.prevent="startDrag"
                >
                    <div class="flex items-center gap-2">
                        <span class="text-xs leading-none text-gray-400">⋮⋮</span>
                        <p class="text-sm font-medium text-gray-700">
                            {{ t('debug.drawingFeatureInfo.windowTitle') }}
                        </p>
                    </div>
                    <UButton
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        square
                        @pointerdown.stop
                        @click="closeWindow"
                    >
                        <X :size="14" />
                    </UButton>
                </div>
            </template>

            <div
                v-if="drawingStore.selectedFeatureInfo"
                class="space-y-2 text-sm"
            >
                {{ elevationProfile?.metadata }}
            </div>
        </UCard>
    </div>
</template>
