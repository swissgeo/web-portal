<script setup lang="ts">
import { LayerType, useLayerStore } from '@swissgeo/layers'
import { IconButton } from '@swissgeo/skeleton'

import { useDrawingManager } from '../../composables/useDrawingManager'

const emit = defineEmits<{
    close: []
}>()

const layerStore = useLayerStore()
const {
    drawingMode,
    isDrawing,
    featureCount,
    startDrawing,
    stopDrawing,
    exportToKML,
    exportToKMZ,
    exportToGPX,
    clearDrawing,
} = useDrawingManager()

const activeMode = ref<'point' | 'linestring' | 'polygon' | null>(null)

function selectDrawingType(type: 'point' | 'linestring' | 'polygon') {
    console.log('selectDrawingType called with:', type, 'current activeMode:', activeMode.value)
    
    if (activeMode.value === type) {
        // If clicking the same button, toggle off
        console.log('Toggling off drawing mode')
        stopDrawing()
        activeMode.value = null
    } else {
        // Start drawing with the selected type
        console.log('Starting new drawing mode:', type)
        startDrawing(type)
        activeMode.value = type
    }
}

function handleClose() {
    // Stop drawing and deactivate mode
    if (isDrawing.value) {
        stopDrawing()
    }
    activeMode.value = null
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
        activeMode.value = null
    }
}
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
                    @click="selectDrawingType('point')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        activeMode === 'point'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📍 Point
                </button>
                <button
                    @click="selectDrawingType('linestring')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        activeMode === 'linestring'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📏 Line
                </button>
                <button
                    @click="selectDrawingType('polygon')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        activeMode === 'polygon'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    ⬡ Polygon
                </button>
            </div>
            <p
                v-if="isDrawing"
                class="mt-2 text-sm text-blue-600"
            >
                {{ drawingMode === 'point' ? 'Click on the map to add a point' : 'Click to start drawing, double-click to finish' }}
            </p>
        </div>

        <div class="mb-4 rounded border border-gray-300 bg-gray-50 p-3">
            <p class="text-sm font-medium text-gray-700">
                Features drawn: <span class="font-bold">{{ featureCount }}</span>
            </p>
        </div>

        <div class="mb-4">
            <p class="mb-2 text-sm font-medium text-gray-700">Export:</p>
            <div class="flex gap-2">
                <button
                    @click="handleExport('kml')"
                    :disabled="featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Export KML
                </button>
                <button
                    @click="handleExport('kmz')"
                    :disabled="featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Export KMZ
                </button>
                <button
                    @click="handleExport('gpx')"
                    :disabled="featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    Export GPX
                </button>
            </div>
        </div>

        <div class="mt-auto">
            <button
                @click="handleClear"
                :disabled="featureCount === 0"
                class="w-full rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                Clear All Drawings
            </button>
        </div>
    </div>
</template>
