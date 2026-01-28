<script setup lang="ts">

import { useDrawingStore, DrawingMode, markerIcons } from '@swissgeo/map'
// import { LayerType, useLayerStore } from '@swissgeo/layers'
import { IconButton } from '@swissgeo/skeleton'

import { useDrawingManager } from '../../composables/useDrawingManager'

const { MARKER_ICONS } = markerIcons

const emit = defineEmits<{
    close: []
}>()

// const layerStore = useLayerStore()
const drawingStore = useDrawingStore()
const {
    startDrawing,
    stopDrawing,
    exportToKML,
    exportToKMZ,
    exportToGPX,
    clearDrawing,
} = useDrawingManager()

function selectDrawingType(type: DrawingMode) {
    console.log('selectDrawingType called with type:', type)
    if (drawingStore.drawingMode === type) {
        // If clicking the same button, toggle off
        console.log('Toggling off drawing mode')
        // stopDrawing()
        drawingStore.setDrawingMode(DrawingMode.None)
    } else {
        // Start drawing with the selected type
        console.log('Starting new drawing mode:', type)
        // startDrawing()
        drawingStore.setDrawingMode(type)

    }
}

function handleClose() {
    // Stop drawing and deactivate mode
    if (drawingStore.isDrawing) {
        stopDrawing()
    }
    drawingStore.setDrawingMode(DrawingMode.None)
    emit('close')
}

async function handleExport(format: 'kml' | 'kmz' | 'gpx') {
    try {
        let blob: Blob
        let filename: string

        switch (format) {
            case 'kml':
                blob = await exportToKML()
                filename = 'drawing.kml'
                break
            case 'kmz':
                blob = await exportToKMZ()
                filename = 'drawing.kmz'
                break
            case 'gpx':
                blob = await exportToGPX()
                filename = 'drawing.gpx'
                break
        }

        // Create download link
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error(`Failed to export ${format.toUpperCase()}:`, error)
    }
}

function handleClear() {
    if (confirm('Are you sure you want to clear all drawings?')) {
        clearDrawing()
        drawingStore.setDrawingMode(DrawingMode.None)
    }
}

function selectIcon(iconId: string) {
    drawingStore.setSelectedIconId(iconId)
}

onMounted(() => {
    console.log('DrawingPanel mounted')
    startDrawing()

})
</script>

<template>
    <div class="relative flex h-full flex-col bg-white p-4 shadow-lg">
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">Drawing Tools</h3>
            <IconButton
                icon="X"
                @click="handleClose"
                severity="secondary"
            />
        </div>

        <div class="mb-4">
            <p class="mb-2 text-sm text-gray-600">Select a drawing tool:</p>
            <div class="flex gap-2">
                <button
                    @click="selectDrawingType(DrawingMode.Point)"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === DrawingMode.Point
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📍 Point
                </button>
                <button
                    @click="selectDrawingType(DrawingMode.LineString)"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === DrawingMode.LineString
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📏 Line
                </button>
                <button
                    @click="selectDrawingType(DrawingMode.Polygon)"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === DrawingMode.Polygon
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    ⬡ Polygon
                </button>
                <button
                    @click="selectDrawingType(DrawingMode.Text)"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === DrawingMode.Text
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📝 Text
                </button>
            </div>
            <p
                v-if="drawingStore.isDrawing"
                class="mt-2 text-sm text-blue-600"
            >
                {{ drawingStore.drawingMode === DrawingMode.Point ? 'Click on the map to add a point' : drawingStore.drawingMode === DrawingMode.Text ? 'Click on the map to add text' : 'Click to start drawing, double-click to finish' }}
            </p>
        </div>

        <!-- Icon Selection (only visible when Point mode is active) -->
        <div
            v-if="drawingStore.drawingMode === DrawingMode.Point"
            class="mb-4"
        >
            <p class="mb-2 text-sm font-medium text-gray-700">Select marker icon:</p>
            <div class="grid grid-cols-3 gap-2">
                <button
                    v-for="icon in MARKER_ICONS"
                    :key="icon.id"
                    @click="selectIcon(icon.id)"
                    :class="[
                        'flex flex-col items-center justify-center rounded border-2 p-2 transition-all hover:bg-gray-50',
                        drawingStore.selectedIconId === icon.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300',
                    ]"
                    :title="icon.name"
                >
                    <img
                        :src="icon.dataUrl"
                        :alt="icon.name"
                        class="h-8 w-8"
                    />
                    <span class="mt-1 text-xs">{{ icon.name }}</span>
                </button>
            </div>
        </div>

        <div class="mb-4 rounded border border-gray-300 bg-gray-50 p-3">
            <p class="text-sm font-medium text-gray-700">
                Features drawn: <span class="font-bold">{{ drawingStore.featureCount }}</span>
            </p>
        </div>

        <div class="mb-4">
            <p class="mb-2 text-sm font-medium text-gray-700">Export:</p>
            <div class="flex gap-2">
                <button
                    @click="handleExport('kml')"
                    :disabled="drawingStore.featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Export KML
                </button>
                <button
                    @click="handleExport('kmz')"
                    :disabled="drawingStore.featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Export KMZ
                </button>
                <button
                    @click="handleExport('gpx')"
                    :disabled="drawingStore.featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Export GPX
                </button>
            </div>
        </div>

        <div class="mt-auto">
            <button
                @click="handleClear"
                :disabled="drawingStore.featureCount === 0"
                class="w-full rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                Clear All Drawings
            </button>
        </div>
    </div>
</template>
