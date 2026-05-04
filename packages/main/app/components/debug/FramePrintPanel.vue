<script setup lang="ts">
import { useMap } from '@swissgeo/map'
import { usePrintFraming } from '../../composables/usePrintFraming';
import { IconButton } from '@swissgeo/skeleton'
import { printFormats, printOrientations  } from '~/types/print'

const emit = defineEmits<{
    close: []
}>()

const { zoomLevel } = useMap()
const { isZoomStepEnabled, selectedPrintFormat, selectedPrintResolution, selectedPrintOrientation, isCenterLocked, isZoomLocked, zoomLevelForPrint, isPrintExtentOutOfBounds, isPrintExtentBeyondViewport, adjustToLockedView, printPreviewUrl } = usePrintFraming()

const printFormatItems = ref(printFormats.map(format => ({
    label: format.toUpperCase(),
    value: format
})))

const printResolutionItems = ref([
    { label: '96 dpi', value: 96 },
    { label: '192 dpi', value: 192 },
    { label: '288 dpi', value: 288 },
])

const printOrientationItems = ref(printOrientations.map(orientation => ({
    label: orientation.toUpperCase(),
    value: orientation
})))

function handleClose() {
    emit('close')
}

</script>

<template>
  
    <div class="container">
        <div>
            <IconButton
                @click="handleClose"
                iconName="X"
                severity="secondary"
            >
            </IconButton>
        </div>
        <div class="flex flex-col gap-4">
            <h3 class="text-lg font-bold mb-4">Print Framing</h3>
            <div>Zoom Level: {{ zoomLevel }}</div>
            <div>Zoom Level for print: {{ zoomLevelForPrint }}</div>
            <div>Out of Swiss bounds: {{ isPrintExtentOutOfBounds }}</div>
            <div>Beyond viewport: {{ isPrintExtentBeyondViewport }}</div>
            <UFormField
                orientation="horizontal"
                label="Enable strict zoom steps"
                class="w-72"
            >
                <USwitch id="enable-zoom-step-checkbox" v-model="isZoomStepEnabled"  />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Lock center to view"
                class="w-72"
            >
                <USwitch id="lock-center-checkbox" v-model="isCenterLocked"  />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Lock zoom to view"
                class="w-72"
            >
                <USwitch id="lock-zoom-checkbox" v-model="isZoomLocked"  />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Print size"
                class="w-72"
            >
                <USelect v-model="selectedPrintFormat" :items="printFormatItems" />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Print resolution"
                class="w-72"
            >
                <USelect v-model="selectedPrintResolution" :items="printResolutionItems" />
            </UFormField>

            <UFormField
                orientation="horizontal"
                label="Print orientation"
                class="w-72"
            >
                <USelect v-model="selectedPrintOrientation" :items="printOrientationItems" />
            </UFormField>
            <UButton v-if="isCenterLocked || isZoomLocked" @click="adjustToLockedView">Zoom to locked zoom level</UButton>
            <a v-if="printPreviewUrl" :href="printPreviewUrl" target="_blank">Open Print Preview</a>

        </div>
    </div>
</template>


<style scoped>

.container {
  background: white;
  width: fit-content;
  height: fit-content;
  z-index: 10;
  min-width: 100px;
  min-height: 100px;
  padding: 10px;
}
</style>