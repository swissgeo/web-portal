<script setup lang="ts">
import type { DatasetLayer, Dimension } from '@swissgeo/layers'

import { useLayerStore } from '@swissgeo/layers'
import { useRecordsData } from '@swissgeo/ogc'
import { useFetch } from '@vueuse/core'
import WMSCapabilities from 'ol/format/WMSCapabilities'
import { computed, watch } from 'vue'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'

import type { WMSLayer } from './types'

import { getTimeInfoFromWMSCapabilities } from '../utils/timeUtils'

const layerStore = useLayerStore()

type WMSCapabilityType = ReturnType<WMSCapabilities['read']>
const { layer, zIndex } = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const gutter = computed(() => {
    return 0
})

const { capabilityUrl } = await useRecordsData(layer.dataset, 'OGC:WMS')

// Fetch capabilities XML directly from external server as raw text
const { data } = await useFetch<string>(capabilityUrl.value)

const capabilityData = computed((): WMSCapabilityType => {
    if (!data.value) {
        throw new Error('Unable to read WMS capabilities')
    }

    const parser = new WMSCapabilities()
    const capabilities = parser.read(data.value)

    return capabilities
})

const version = computed(() => capabilityData.value.version)

const url = computed(() => capabilityData.value.Service.OnlineResource)

const dimensions = computed(() => {
    const layerData = capabilityData.value.Capability.Layer.Layer
    const thisLayer = layerData.find((_layer: WMSLayer) => _layer.Name === layer.dataset.id)
    if (thisLayer && 'Dimension' in thisLayer) {
        return thisLayer.Dimension
    }
    return undefined
})

const timeInfo = computed(() => {
    const { defaultTime, availableTimes } = getTimeInfoFromWMSCapabilities(dimensions.value)
    return { defaultTime, availableTimes }
})

const initialTimestamp = computed(() => {
    return timeInfo.value.defaultTime
})

const { setVisibility, setZIndex, updateTimeDimension, setOpacity } = useOlWmsLayer(
    layer.dataset.id,
    layer.uuid,
    gutter.value,
    layer.opacity,
    url.value,
    version.value,
    zIndex,
    initialTimestamp.value
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

watch(
    () => timeInfo.value,
    ({ defaultTime, availableTimes }) => {
        // once we have the info from the capabilities, we push them to the store
        const dimension: Partial<Dimension> = {}

        if (defaultTime) {
            dimension.currentValue = defaultTime
        }
        if (availableTimes) {
            dimension.availableValues = availableTimes
        }
        layerStore.setDimension('time', layer.uuid, dimension)
    },
    { immediate: true }
)

watch(
    () => layer.dimensions,
    () => {
        if (layer.dimensions && 'time' in layer.dimensions && layer.dimensions.time?.currentValue) {
            updateTimeDimension(layer.dimensions.time.currentValue)
        }
    },
    { deep: true }
)

watch(
    () => layer.opacity,
    (newOpacity: number) => {
        setOpacity(newOpacity)
    }
)
</script>

<template>
    <slot />
</template>
