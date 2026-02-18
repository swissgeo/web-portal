<script setup lang="ts">
import type { DrawingMode } from '@swissgeo/drawing'

import { useDrawingStore, MARKER_ICONS, useDrawingManager } from '@swissgeo/drawing'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { IconButton } from '@swissgeo/skeleton'
import { onMounted } from 'vue'

const emit = defineEmits<{
    close: []
}>()

const drawingStore = useDrawingStore()
const { startDrawing, stopDrawing, downloadKML, downloadKMZ, downloadGPX, clearDrawing } =
    useDrawingManager()

function selectDrawingType(type: DrawingMode) {
    if (drawingStore.drawingMode === type) {
        drawingStore.setDrawingMode('None')
    } else {
        drawingStore.setDrawingMode(type)
    }
}

function handleClose() {
    if (drawingStore.isDrawing) {
        stopDrawing()
    }
    drawingStore.setDrawingMode('None')
    emit('close')
}

async function handleExport(format: 'kml' | 'kmz' | 'gpx') {
    try {
        switch (format) {
            case 'kml':
                downloadKML()
                return
            case 'kmz':
                await downloadKMZ()
                return
            case 'gpx':
                downloadGPX()
                return
        }
    } catch (error) {
        log.error({
            title: 'DrawingPanel/handleExport',
            titleColor: LogPreDefinedColor.Red,
            messages: ['Failed to export', format.toUpperCase(), error],
        })
    }
}

function handleClear() {
    if (confirm('Are you sure you want to clear all drawings?')) {
        clearDrawing()
        drawingStore.setDrawingMode('None')
    }
}

function selectIcon(iconId: string) {
    drawingStore.setSelectedIconId(iconId)
}

onMounted(() => {
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
                    @click="selectDrawingType('Point')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === 'Point'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📍 Point
                </button>
                <button
                    @click="selectDrawingType('LineString')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === 'LineString'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📏 Line
                </button>
                <button
                    @click="selectDrawingType('Polygon')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === 'Polygon'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    ⬡ Polygon
                </button>
                <button
                    @click="selectDrawingType('Text')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === 'Text'
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
                {{
                    drawingStore.drawingMode === 'Point'
                        ? 'Click on the map to add a point'
                        : drawingStore.drawingMode === 'Text'
                          ? 'Click on the map to add text'
                          : 'Click to start drawing, double-click to finish'
                }}
            </p>
        </div>

        <!-- Icon Selection (only visible when Point mode is active) -->
        <div
            v-if="drawingStore.drawingMode === 'Point'"
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
                        class="h-6"
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
