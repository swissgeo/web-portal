<script setup lang="ts">
import { Feature, type Map as OlMapType } from 'ol'
import {containsExtent, type Extent} from 'ol/extent';
import type {PrintFormat, PrintOrientation} from '~/types/print'

import { usePrintFraming, useMap } from '@swissgeo/map'
import { IconButton } from '@swissgeo/skeleton'
import { printFormats, printOrientations  } from '~/types/print'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Fill, Style } from 'ol/style'
import { EPSG_2056_BOUNDING_BOX } from '@swissgeo/shared'
import { createCutoutGeometry } from '@swissgeo/coordinates';

const emit = defineEmits<{
    close: []
}>()

const { zoomLevel, olMap, center, viewportExtent } = useMap()

const printExtentFeature = new Feature()
const printExtentLayer = new VectorLayer({
    source: new VectorSource({
        features: [ printExtentFeature ],
    }),
    style: new Style({
        fill: new Fill({
            color: 'rgba(0, 0, 30, 0.6)',
        })
    }),
})

function mountPrintExtentLayer() {
    if (!olMap.value) return
    olMap.value.addLayer(printExtentLayer)
}

function unmountPrintExtentLayer() {
    if (!olMap.value) return
    olMap.value.removeLayer(printExtentLayer)
}

onMounted(() => {
    mountPrintExtentLayer()
})

onBeforeUnmount(() => {
    unmountPrintExtentLayer()
})

const printFormatItems = ref(printFormats.map(format => ({
    label: format.toUpperCase(),
    value: format
})))
const selectedPrintFormat = ref<PrintFormat>("a4")

const printResolutionItems = ref([
    { label: '96 dpi', value: 96 },
    { label: '192 dpi', value: 192 },
    { label: '288 dpi', value: 288 },
])
const selectedPrintResolution = ref(96)


const printOrientationItems = ref(printOrientations.map(orientation => ({
    label: orientation.toUpperCase(),
    value: orientation
})))
const selectedPrintOrientation = ref<PrintOrientation>("landscape")

const pageSizeInPixels = computed(() => {
    return getPageSizeInPixels(
        selectedPrintFormat.value,
        selectedPrintOrientation.value,
        selectedPrintResolution.value
    )
})

// const { isEnabled} = usePrintFraming()
const isCenterLocked = ref(false)
const lastUnlockedCenter = ref<[number, number]>([0, 0])
const centerForPrint = computed(() => {
    if (!isCenterLocked.value) {
        lastUnlockedCenter.value = center.value
    }
    return lastUnlockedCenter.value
})

const isZoomLocked = ref(false)
const lastUnlockedZoomLevel = ref(zoomLevel.value)
const zoomLevelForPrint = computed(() => {
    if (!isZoomLocked.value) {
        lastUnlockedZoomLevel.value = Math.ceil(zoomLevel.value)
    }
    return lastUnlockedZoomLevel.value
})

onMounted(() => {
    console.log("olMap", olMap.value)
})

function handleClose() {
    emit('close')
}

const printExtent = computed(() => {
    if (!olMap.value) return null
    return getPrintExtent(
        olMap.value,
        zoomLevelForPrint.value,
        pageSizeInPixels.value.width,
        pageSizeInPixels.value.height,
        centerForPrint.value,
    )
})

const isPrintExtentOutOfBounds = computed(() => {
    if (!printExtent.value) return false
    return !containsExtent(EPSG_2056_BOUNDING_BOX, printExtent.value)
})

const isPrintExtentBeyondViewport = computed(() => {
    console.log("DEBUG 1");
    
    if (!printExtent.value || !olMap.value) return false
    console.log("DEBUG 2");

    return !containsExtent(viewportExtent.value, printExtent.value)
})


function getPrintExtent(map: OlMapType, printZoom: number, widthPx: number, heightPx: number, mapCenter: [number, number]): [number, number, number, number] | null {
    const view = map.getView()

    const resolution = view.getResolutionForZoom(printZoom)
    if (!resolution) return null

    const halfWidth = (widthPx * resolution) / 2
    const halfHeight = (heightPx * resolution) / 2

    return [
        mapCenter[0] - halfWidth,
        mapCenter[1] - halfHeight,
        mapCenter[0] + halfWidth,
        mapCenter[1] + halfHeight,
    ]
}


watch(printExtent, (newExtent) => {
    if (!newExtent) return

    const polygon = createCutoutGeometry(EPSG_2056_BOUNDING_BOX, newExtent)
    if (!polygon) return
    printExtentFeature.setGeometry(polygon)
})



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
        <div>
            <h2 class="text-lg font-bold mb-4">Print Framing</h2>
            <div>Zoom Level: {{ zoomLevel }}</div>
            <div>Zoom Level for print: {{ zoomLevelForPrint }}</div>
            <div>Out of Swiss bounds: {{ isPrintExtentOutOfBounds }}</div>
            <div>Beyond viewport: {{ isPrintExtentBeyondViewport }}</div>
            <!-- <UFormField
                orientation="horizontal"
                label="Enable Print Framing"
                class="w-72"
            >
                <USwitch id="enable-checkbox" v-model="isEnabled"  />
            </UFormField> -->

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
}
</style>