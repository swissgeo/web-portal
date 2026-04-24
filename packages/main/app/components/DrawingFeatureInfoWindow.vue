<script setup lang="ts">
import type { DrawingFeatureKind, TextAnchor } from '@swissgeo/drawing'
import type { Feature } from 'ol'
import type { Geometry } from 'ol/geom'

import { MARKER_ICONS, resolveFeatureId, useDrawingStore } from '@swissgeo/drawing'
import { Eye, EyeOff, MapPin, Trash2, Type, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onBeforeMount, reactive, ref, watch } from 'vue'

const drawingStore = useDrawingStore()
const { t } = useI18n()
const windowRef = ref<HTMLElement | null>(null)

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

const TEXT_ANCHOR_OPTIONS: TextAnchor[] = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
]

const markerSizeOptions = computed(() => [
    { label: t('debug.drawingFeatureInfo.sizeSmall'), value: 0.7 },
    { label: t('debug.drawingFeatureInfo.sizeMedium'), value: 1 },
    { label: t('debug.drawingFeatureInfo.sizeLarge'), value: 1.4 },
    { label: t('debug.drawingFeatureInfo.sizeExtraLarge'), value: 1.8 },
])

const textSizeOptions = computed(() => [
    { label: t('debug.drawingFeatureInfo.sizeSmall'), value: 12 },
    { label: t('debug.drawingFeatureInfo.sizeMedium'), value: 16 },
    { label: t('debug.drawingFeatureInfo.sizeLarge'), value: 20 },
    { label: t('debug.drawingFeatureInfo.sizeExtraLarge'), value: 24 },
])

const strokeWidthOptions = computed(() => [
    { label: t('debug.drawingFeatureInfo.strokeThin'), value: 1 },
    { label: t('debug.drawingFeatureInfo.strokeMedium'), value: 2 },
    { label: t('debug.drawingFeatureInfo.strokeThick'), value: 4 },
    { label: t('debug.drawingFeatureInfo.strokeExtraThick'), value: 6 },
])

const opacityOptions = computed(() => [
    { label: '20%', value: 0.2 },
    { label: '40%', value: 0.4 },
    { label: '60%', value: 0.6 },
    { label: '80%', value: 0.8 },
    { label: '100%', value: 1 },
])

const textAnchorOptions = computed(() =>
    TEXT_ANCHOR_OPTIONS.map((anchor) => ({
        value: anchor,
        label: t(`debug.drawingFeatureInfo.anchor.${anchor}`),
    }))
)

const showMarkerStyleMenu = ref(false)
const showTextStyleMenu = ref(false)
const isHydratingEditor = ref(false)
const editorState = reactive({
    title: '',
    text: '',
    description: '',
    isDescriptionVisible: false,
    iconId: MARKER_ICONS[0]?.id ?? '',
    iconColor: '#ff0000',
    iconSize: 1,
    textColor: '#111827',
    textSize: 16,
    textAnchor: 'center' as TextAnchor,
    strokeColor: '#ff0000',
    strokeWidth: 2,
    strokeOpacity: 1,
    fillColor: '#ff0000',
    fillOpacity: 0.2,
    isDashedLine: false,
})

const selectedFeature = computed<Feature<Geometry> | null>(() => {
    const selectedId = drawingStore.selectedFeatureId
    if (!selectedId) {
        return null
    }

    const features = drawingStore.drawingFeatures as Feature<Geometry>[]
    return features.find((feature) => resolveFeatureId(feature) === selectedId) ?? null
})

const selectedFeatureKind = computed<DrawingFeatureKind | null>(() => {
    if (!selectedFeature.value) {
        return null
    }
    return drawingStore.ensureFeatureAttributes(selectedFeature.value).kind
})

const isPointFeatureSelected = computed(() => selectedFeatureKind.value === 'Point')
const isTextFeatureSelected = computed(() => selectedFeatureKind.value === 'Text')
const isLineFeatureSelected = computed(() => selectedFeatureKind.value === 'LineString')
const isPolygonFeatureSelected = computed(() => selectedFeatureKind.value === 'Polygon')
const isMeasurementFeatureSelected = computed(
    () =>
        selectedFeatureKind.value === 'MeasurementRadius' ||
        selectedFeatureKind.value === 'MeasurementPath'
)
const isLineOrPolygonFeatureSelected = computed(
    () => isLineFeatureSelected.value || isPolygonFeatureSelected.value
)
const isTitleOrTextEditableFeatureSelected = computed(
    () => isPointFeatureSelected.value || isTextFeatureSelected.value
)
const isDescriptionEditableFeatureSelected = computed(
    () =>
        isPointFeatureSelected.value ||
        isTextFeatureSelected.value ||
        isLineFeatureSelected.value ||
        isPolygonFeatureSelected.value ||
        isMeasurementFeatureSelected.value
)

function resolveString(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback
}

function resolveNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function loadSelectedFeatureIntoEditor(feature: Feature<Geometry> | null) {
    if (!feature) {
        return
    }

    isHydratingEditor.value = true
    const attributes = drawingStore.ensureFeatureAttributes(feature)
    const style = (attributes.style as Record<string, unknown>) ?? {}

    editorState.title = attributes.title
    editorState.text = String(feature.get('text') ?? '')
    editorState.description = attributes.description
    editorState.isDescriptionVisible = attributes.isDescriptionVisible
    editorState.iconId = resolveString(
        style.iconId ?? feature.get('iconId') ?? MARKER_ICONS[0]?.id,
        MARKER_ICONS[0]?.id ?? ''
    )
    editorState.iconColor = resolveString(style.iconColor, '#ff0000')
    editorState.iconSize = resolveNumber(style.iconSize, 1)
    editorState.textColor = resolveString(style.textColor, '#111827')
    editorState.textSize = resolveNumber(style.textSize, 16)
    editorState.textAnchor = resolveString(style.textAnchor, 'center') as TextAnchor
    editorState.strokeColor = resolveString(style.strokeColor, '#ff0000')
    editorState.strokeWidth = resolveNumber(style.strokeWidth, 2)
    editorState.strokeOpacity = resolveNumber(style.strokeOpacity, 1)
    editorState.fillColor = resolveString(style.fillColor, '#ff0000')
    editorState.fillOpacity = resolveNumber(style.fillOpacity, 0.2)
    const dashPattern = Array.isArray(style.dashPattern) ? style.dashPattern : undefined
    editorState.isDashedLine =
        Boolean(dashPattern) &&
        dashPattern!.every((value) => typeof value === 'number' && Number.isFinite(value))
    isHydratingEditor.value = false
}

function syncSelectedFeatureInfo() {
    if (!drawingStore.selectedFeatureInfo || !selectedFeature.value) {
        return
    }

    const title = isTitleOrTextEditableFeatureSelected.value
        ? editorState.title
        : String(selectedFeature.value.get('title') ?? '')

    const nextInfo = {
        ...drawingStore.selectedFeatureInfo,
        title,
        description: editorState.description,
        text: isTextFeatureSelected.value
            ? editorState.text
            : String(selectedFeature.value.get('text') ?? ''),
    }

    drawingStore.setSelectedFeatureInfo(nextInfo)
}

function applySelectedFeatureChanges() {
    if (isHydratingEditor.value) {
        return
    }

    const feature = selectedFeature.value
    if (!feature || !isDescriptionEditableFeatureSelected.value) {
        return
    }

    const styleUpdate: Record<string, unknown> = {}

    if (isPointFeatureSelected.value || isTextFeatureSelected.value) {
        styleUpdate.textColor = editorState.textColor
        styleUpdate.textSize = editorState.textSize
    }

    if (isLineOrPolygonFeatureSelected.value) {
        styleUpdate.strokeColor = editorState.strokeColor
        styleUpdate.strokeWidth = editorState.strokeWidth
        styleUpdate.strokeOpacity = editorState.strokeOpacity
        styleUpdate.dashPattern = editorState.isDashedLine ? [8, 4] : undefined
    }

    if (isPolygonFeatureSelected.value) {
        styleUpdate.fillColor = editorState.fillColor
        styleUpdate.fillOpacity = editorState.fillOpacity
    }

    if (isPointFeatureSelected.value) {
        styleUpdate.iconId = editorState.iconId
        styleUpdate.iconColor = editorState.iconColor
        styleUpdate.iconSize = editorState.iconSize
        styleUpdate.textAnchor = editorState.textAnchor
    }

    drawingStore.updateFeatureAttributes(feature, {
        title: isTitleOrTextEditableFeatureSelected.value
            ? editorState.title
            : String(feature.get('title') ?? ''),
        description: editorState.description,
        isDescriptionVisible: editorState.isDescriptionVisible,
        style: styleUpdate,
    })

    if (isTextFeatureSelected.value) {
        feature.set('text', editorState.text)
    }

    feature.changed()
    syncSelectedFeatureInfo()
}

function toggleDescriptionVisibility() {
    editorState.isDescriptionVisible = !editorState.isDescriptionVisible
    applySelectedFeatureChanges()
}

function deleteSelectedFeature() {
    const feature = selectedFeature.value
    if (!feature) {
        return
    }

    const selectedId = resolveFeatureId(feature)
    const source = drawingStore.olLayer?.getSource()
    if (source) {
        source.removeFeature(feature)
    }

    const features = drawingStore.drawingFeatures as unknown as Feature<Geometry>[]
    const remaining = features.filter((candidate) => resolveFeatureId(candidate) !== selectedId)
    features.splice(0, features.length, ...remaining)
    drawingStore.setDrawingMode('None')
    drawingStore.clearPassiveSelection()
}

function selectEditorIcon(iconId: string) {
    editorState.iconId = iconId
    applySelectedFeatureChanges()
}

function toggleMarkerStyleMenu() {
    showMarkerStyleMenu.value = !showMarkerStyleMenu.value
    if (showMarkerStyleMenu.value) {
        showTextStyleMenu.value = false
    }
}

function toggleTextStyleMenu() {
    showTextStyleMenu.value = !showTextStyleMenu.value
    if (showTextStyleMenu.value) {
        showMarkerStyleMenu.value = false
    }
}

watch(
    selectedFeature,
    (feature) => {
        showMarkerStyleMenu.value = false
        showTextStyleMenu.value = false
        loadSelectedFeatureIntoEditor(feature)
    },
    { immediate: true }
)

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

    const element = windowRef.value
    const width = element?.offsetWidth ?? 384
    const initial = clampToViewport(window.innerWidth - width - WINDOW_MARGIN, WINDOW_MARGIN)
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
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleWindowResize)
    }
})

const selectedFeatureInfoTitle = computed(() => {
    if (!drawingStore.selectedFeatureInfo) {
        return '-'
    }

    const title = drawingStore.selectedFeatureInfo.title.trim()
    const text = drawingStore.selectedFeatureInfo.text?.trim() || ''
    return title || text || '-'
})

const selectedFeatureDescription = computed(
    () => drawingStore.selectedFeatureInfo?.description?.trim() || '-'
)

function formatCoordinate(value: number[] | undefined): string {
    if (!value || value.length < 2) {
        return '-'
    }

    const x = value[0]
    const y = value[1]
    if (typeof x !== 'number' || typeof y !== 'number') {
        return '-'
    }

    return `${x.toFixed(2)}, ${y.toFixed(2)}`
}

function formatMeters(value: number | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }

    if (value > 10000) {
        return `${(value / 1000).toFixed(2)} km`
    }

    return `${value.toFixed(2)} m`
}

function formatSquareMeters(value: number | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }

    if (value > 10000) {
        return `${(value / 1_000_000).toFixed(2)} km²`
    }

    return `${value.toFixed(2)} m²`
}

function getFeatureMetric(metric: 'area' | 'perimeter'): number | undefined {
    const info = drawingStore.selectedFeatureInfo as Record<string, unknown> | null
    if (!info) {
        return undefined
    }

    const metricValue = info[metric]
    return typeof metricValue === 'number' ? metricValue : undefined
}

function closeWindow() {
    drawingStore.clearPassiveSelection()
}

function translateFeatureKind(kind: DrawingFeatureKind): string {
    if (kind === 'Point') {
        return t('debug.drawingFeatureInfo.kind.point')
    }
    if (kind === 'Text') {
        return t('debug.drawingFeatureInfo.kind.text')
    }
    if (kind === 'LineString') {
        return t('debug.drawingFeatureInfo.kind.lineString')
    }
    if (kind === 'Polygon') {
        return t('debug.drawingFeatureInfo.kind.polygon')
    }
    if (kind === 'MeasurementRadius') {
        return t('debug.drawingFeatureInfo.kind.measurementRadius')
    }
    if (kind === 'MeasurementPath') {
        return t('debug.drawingFeatureInfo.kind.measurementPath')
    }
    return t('debug.drawingFeatureInfo.kind.unknown')
}
</script>

<template>
    <div
        ref="windowRef"
        v-if="hasInfo"
        class="fixed z-[9998] w-96 shadow-lg"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
        <UCard>
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
                <p>
                    <span class="font-medium">{{ t('debug.drawingFeatureInfo.typeLabel') }}:</span>
                    {{ translateFeatureKind(drawingStore.selectedFeatureInfo.kind) }}
                </p>

                <template v-if="isDescriptionEditableFeatureSelected">
                    <div v-if="isTitleOrTextEditableFeatureSelected">
                        <label class="mb-1 block text-sm font-medium">
                            {{
                                isTextFeatureSelected
                                    ? t('debug.drawingFeatureInfo.textLabel')
                                    : t('debug.drawingFeatureInfo.titleLabel')
                            }}
                        </label>
                        <textarea
                            v-if="isTextFeatureSelected"
                            v-model="editorState.text"
                            rows="2"
                            class="w-full rounded border border-gray-300 px-2 py-1"
                            @input="applySelectedFeatureChanges"
                        />
                        <input
                            v-else
                            v-model="editorState.title"
                            type="text"
                            class="w-full rounded border border-gray-300 px-2 py-1"
                            @input="applySelectedFeatureChanges"
                        />
                    </div>

                    <div>
                        <div class="mb-1 flex items-center justify-between">
                            <label class="text-sm font-medium">{{
                                t('debug.drawingFeatureInfo.descriptionLabel')
                            }}</label>
                            <div class="flex items-center gap-1">
                                <button
                                    v-if="isPointFeatureSelected || isTextFeatureSelected"
                                    class="rounded border border-gray-300 px-2 py-1 text-xs"
                                    :title="
                                        editorState.isDescriptionVisible
                                            ? t('debug.drawingFeatureInfo.hideDescriptionOnMap')
                                            : t('debug.drawingFeatureInfo.showDescriptionOnMap')
                                    "
                                    @click="toggleDescriptionVisibility"
                                >
                                    <Eye
                                        v-if="editorState.isDescriptionVisible"
                                        :size="14"
                                    />
                                    <EyeOff
                                        v-else
                                        :size="14"
                                    />
                                </button>
                                <button
                                    v-if="isPointFeatureSelected"
                                    class="rounded border border-gray-300 px-2 py-1 text-xs"
                                    :title="t('debug.drawingFeatureInfo.markerStyleButton')"
                                    @click="toggleMarkerStyleMenu"
                                >
                                    <MapPin :size="14" />
                                </button>
                                <button
                                    v-if="isPointFeatureSelected || isTextFeatureSelected"
                                    class="rounded border border-gray-300 px-2 py-1 text-xs"
                                    :title="t('debug.drawingFeatureInfo.textStyleButton')"
                                    @click="toggleTextStyleMenu"
                                >
                                    <Type :size="14" />
                                </button>
                            </div>
                        </div>
                        <textarea
                            v-model="editorState.description"
                            rows="2"
                            class="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                            @input="applySelectedFeatureChanges"
                        />
                    </div>

                    <div
                        v-if="showMarkerStyleMenu && isPointFeatureSelected"
                        class="space-y-2 rounded border border-gray-300 bg-gray-50 p-2"
                    >
                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.markerSizeLabel')
                            }}</label>
                            <select
                                v-model.number="editorState.iconSize"
                                class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                @change="applySelectedFeatureChanges"
                            >
                                <option
                                    v-for="size in markerSizeOptions"
                                    :key="size.label"
                                    :value="size.value"
                                >
                                    {{ size.label }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.markerColorLabel')
                            }}</label>
                            <input
                                v-model="editorState.iconColor"
                                type="color"
                                class="h-8 w-full rounded border border-gray-300"
                                @input="applySelectedFeatureChanges"
                            />
                        </div>
                        <div>
                            <p class="mb-1 text-xs font-medium">
                                {{ t('debug.drawingFeatureInfo.markerSymbolLabel') }}
                            </p>
                            <div class="grid grid-cols-6 gap-1">
                                <button
                                    v-for="icon in MARKER_ICONS"
                                    :key="`info-editor-${icon.id}`"
                                    :class="[
                                        'flex items-center justify-center rounded border p-1',
                                        editorState.iconId === icon.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 bg-white',
                                    ]"
                                    @click="selectEditorIcon(icon.id)"
                                >
                                    <img
                                        :src="icon.dataUrl"
                                        :alt="icon.name"
                                        class="h-4"
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="
                            showTextStyleMenu && (isPointFeatureSelected || isTextFeatureSelected)
                        "
                        class="space-y-2 rounded border border-gray-300 bg-gray-50 p-2"
                    >
                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.textSizeLabel')
                            }}</label>
                            <select
                                v-model.number="editorState.textSize"
                                class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                @change="applySelectedFeatureChanges"
                            >
                                <option
                                    v-for="size in textSizeOptions"
                                    :key="size.label"
                                    :value="size.value"
                                >
                                    {{ size.label }}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.textColorLabel')
                            }}</label>
                            <input
                                v-model="editorState.textColor"
                                type="color"
                                class="h-8 w-full rounded border border-gray-300"
                                @input="applySelectedFeatureChanges"
                            />
                        </div>
                        <div v-if="isPointFeatureSelected">
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.textAnchorLabel')
                            }}</label>
                            <select
                                v-model="editorState.textAnchor"
                                class="w-full rounded border border-gray-300 px-2 py-1"
                                @change="applySelectedFeatureChanges"
                            >
                                <option
                                    v-for="anchor in textAnchorOptions"
                                    :key="anchor.value"
                                    :value="anchor.value"
                                >
                                    {{ anchor.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div
                        v-if="isLineOrPolygonFeatureSelected"
                        class="space-y-2 rounded border border-gray-300 bg-gray-50 p-2"
                    >
                        <p class="text-xs font-medium">
                            {{ t('debug.drawingFeatureInfo.lineStyleLabel') }}
                        </p>
                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.strokeWidthLabel')
                            }}</label>
                            <select
                                v-model.number="editorState.strokeWidth"
                                class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                @change="applySelectedFeatureChanges"
                            >
                                <option
                                    v-for="option in strokeWidthOptions"
                                    :key="option.label"
                                    :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.strokeOpacityLabel')
                            }}</label>
                            <select
                                v-model.number="editorState.strokeOpacity"
                                class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                @change="applySelectedFeatureChanges"
                            >
                                <option
                                    v-for="option in opacityOptions"
                                    :key="`stroke-${option.label}`"
                                    :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.strokeColorLabel')
                            }}</label>
                            <input
                                v-model="editorState.strokeColor"
                                type="color"
                                class="h-8 w-full rounded border border-gray-300"
                                @input="applySelectedFeatureChanges"
                            />
                        </div>

                        <label class="flex items-center gap-2 text-xs">
                            <input
                                v-model="editorState.isDashedLine"
                                type="checkbox"
                                @change="applySelectedFeatureChanges"
                            />
                            {{ t('debug.drawingFeatureInfo.dashedLineLabel') }}
                        </label>

                        <div v-if="isPolygonFeatureSelected">
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.fillColorLabel')
                            }}</label>
                            <input
                                v-model="editorState.fillColor"
                                type="color"
                                class="h-8 w-full rounded border border-gray-300"
                                @input="applySelectedFeatureChanges"
                            />
                        </div>

                        <div v-if="isPolygonFeatureSelected">
                            <label class="mb-1 block text-xs font-medium">{{
                                t('debug.drawingFeatureInfo.fillOpacityLabel')
                            }}</label>
                            <select
                                v-model.number="editorState.fillOpacity"
                                class="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                @change="applySelectedFeatureChanges"
                            >
                                <option
                                    v-for="option in opacityOptions"
                                    :key="`fill-${option.label}`"
                                    :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <button
                            class="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                            :title="t('debug.drawingFeatureInfo.deleteFeatureButton')"
                            @click="deleteSelectedFeature"
                        >
                            <Trash2 :size="14" />
                        </button>
                    </div>
                </template>

                <template v-else>
                    <p>
                        <span class="font-medium"
                            >{{ t('debug.drawingFeatureInfo.titleOrTextLabel') }}:</span
                        >
                        {{ selectedFeatureInfoTitle }}
                    </p>
                    <p>
                        <span class="font-medium"
                            >{{ t('debug.drawingFeatureInfo.descriptionLabel') }}:</span
                        >
                        {{ selectedFeatureDescription }}
                    </p>
                </template>

                <p v-if="['Point', 'Text'].includes(drawingStore.selectedFeatureInfo.kind)">
                    <span class="font-medium"
                        >{{ t('debug.drawingFeatureInfo.coordinatesLabel') }}:</span
                    >
                    {{ formatCoordinate(drawingStore.selectedFeatureInfo.coordinate) }}
                </p>
                <template v-if="drawingStore.selectedFeatureInfo.kind === 'Polygon'">
                    <p>
                        <span class="font-medium"
                            >{{ t('debug.drawingFeatureInfo.areaLabel') }}:</span
                        >
                        {{ formatSquareMeters(getFeatureMetric('area')) }}
                    </p>
                    <p>
                        <span class="font-medium"
                            >{{ t('debug.drawingFeatureInfo.perimeterLabel') }}:</span
                        >
                        {{ formatMeters(getFeatureMetric('perimeter')) }}
                    </p>
                </template>
            </div>
        </UCard>
    </div>
</template>
