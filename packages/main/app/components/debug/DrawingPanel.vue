<script setup lang="ts">
import type { DrawingMode } from '@swissgeo/drawing'

import { useDrawingStore, useDrawingManager } from '@swissgeo/drawing'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { IconButton } from '@swissgeo/skeleton'
import { computed, onMounted, ref } from 'vue'

const emit = defineEmits<{
    close: []
}>()

const drawingStore = useDrawingStore()
const { t } = useI18n()
const { startDrawing, stopDrawing, downloadKML, downloadKMZ, downloadGPX, clearDrawing } =
    useDrawingManager()
const isClearConfirmOpen = ref(false)

const drawingInstruction = computed(() => {
    if (!drawingStore.isDrawing) {
        return ''
    }

    if (drawingStore.drawingMode === 'Point') {
        return t('debug.drawingInstructionPoint')
    }
    if (drawingStore.drawingMode === 'LineString') {
        return t('debug.drawingInstructionLine')
    }
    if (drawingStore.drawingMode === 'Text') {
        return t('debug.drawingInstructionText')
    }
    if (drawingStore.drawingMode === 'Measurement') {
        if (drawingStore.measurementSubtype === 'Radius') {
            return t('debug.drawingInstructionMeasurementRadius')
        }
        return t('debug.drawingInstructionMeasurementPath')
    }

    return t('debug.drawingInstructionDefault')
})

function updateDrawingName(event: Event) {
    const target = event.target as HTMLInputElement | null
    drawingStore.setDrawingName(target?.value ?? '')
}

function selectDrawingType(type: DrawingMode) {
    if (drawingStore.drawingMode === type) {
        drawingStore.setDrawingMode('None')
        drawingStore.setDrawingEnabled(false)
        return
    }

    drawingStore.setDrawingMode(type)
    drawingStore.setDrawingEnabled(true)
    drawingStore.clearPassiveSelection()
}

function handleClose() {
    stopDrawing()
    drawingStore.setDrawingMode('None')
    drawingStore.setDrawingEnabled(false)
    drawingStore.clearPassiveSelection()
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

function openClearConfirmation() {
    isClearConfirmOpen.value = true
}

function confirmClear() {
    clearDrawing()
    drawingStore.setDrawingMode('None')
    drawingStore.clearPassiveSelection()
    isClearConfirmOpen.value = false
}

onMounted(() => {
    startDrawing()
    drawingStore.setDrawingEnabled(false)
})
</script>

<template>
    <div class="relative flex h-full flex-col bg-white p-4 shadow-lg">
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ t('debug.drawingPanelTitle') }}</h3>
            <IconButton
                iconName="X"
                @click="handleClose"
                severity="secondary"
            />
        </div>

        <div class="mb-4">
            <label
                for="drawing-name-input"
                class="mb-2 block text-sm font-medium text-gray-700"
            >
                {{ t('debug.drawingNameLabel') }}
            </label>
            <input
                id="drawing-name-input"
                :value="drawingStore.drawingName"
                type="text"
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                @input="updateDrawingName"
            />
        </div>

        <div class="mb-4">
            <p class="mb-2 text-sm text-gray-600">{{ t('debug.drawingToolSelectLabel') }}</p>
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
                    📍 {{ t('debug.drawingToolPoint') }}
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
                    📏 {{ t('debug.drawingToolLine') }}
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
                    📝 {{ t('debug.drawingToolText') }}
                </button>
                <button
                    @click="selectDrawingType('Measurement')"
                    :class="[
                        'rounded px-4 py-2 font-medium transition-colors',
                        drawingStore.drawingMode === 'Measurement'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                    ]"
                >
                    📐 {{ t('debug.drawingToolMeasurement') }}
                </button>
            </div>
            <p
                v-if="drawingStore.isDrawing"
                class="mt-2 text-sm text-blue-600"
            >
                {{ drawingInstruction }}
            </p>
        </div>

        <div class="mb-4 rounded border border-gray-300 bg-gray-50 p-3">
            <p class="text-sm font-medium text-gray-700">
                {{ t('debug.drawingFeaturesDrawnLabel') }}:
                <span class="font-bold">{{ drawingStore.featureCount }}</span>
            </p>
        </div>

        <div class="mb-4">
            <p class="mb-2 text-sm font-medium text-gray-700">
                {{ t('debug.drawingExportLabel') }}
            </p>
            <div class="flex gap-2">
                <button
                    @click="handleExport('kml')"
                    :disabled="drawingStore.featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {{ t('debug.drawingExportKML') }}
                </button>
                <button
                    @click="handleExport('kmz')"
                    :disabled="drawingStore.featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {{ t('debug.drawingExportKMZ') }}
                </button>
                <button
                    @click="handleExport('gpx')"
                    :disabled="drawingStore.featureCount === 0"
                    class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {{ t('debug.drawingExportGPX') }}
                </button>
            </div>
        </div>

        <div class="mt-auto">
            <button
                @click="openClearConfirmation"
                :disabled="drawingStore.featureCount === 0"
                class="w-full rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                {{ t('debug.drawingClearAll') }}
            </button>
        </div>

        <UModal
            v-model:open="isClearConfirmOpen"
            :title="t('debug.drawingClearConfirmTitle')"
            :description="t('debug.drawingClearConfirmDescription')"
        >
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        color="neutral"
                        variant="outline"
                        @click="isClearConfirmOpen = false"
                    >
                        {{ t('debug.drawingClearConfirmCancel') }}
                    </UButton>
                    <UButton
                        color="error"
                        @click="confirmClear"
                    >
                        {{ t('debug.drawingClearConfirmConfirm') }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>
