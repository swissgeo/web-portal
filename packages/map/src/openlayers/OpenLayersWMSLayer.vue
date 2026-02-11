<script setup lang="ts">
import type { DatasetLayer, Dimension } from '@swissgeo/layers'
import type { WMSCapabilities as WMSCapabilityType } from '@swissgeo/ogc'

import { useLayerStore } from '@swissgeo/layers'
import { useRecordsData } from '@swissgeo/ogc'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'

import { getTimeInfoFromWMSCapabilities } from '../utils/timeUtils'

const layerStore = useLayerStore()


const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const gutter = computed(() => {
    return 0
})

const { capabilityUrl } = await useRecordsData(layer.dataset, 'OGC:WMS')

// Fetch the already-parsed capabilities from the wmsConfig endpoint
const { data: capabilityData } = await useFetch<WMSCapabilityType>(capabilityUrl.value)

if (!capabilityData.value) {
    throw new Error('Unable to read WMS capabilities')
}

const version = computed(() => {
    if (!capabilityData.value) {
        throw new Error('WMS capabilities not loaded')
    }
    return capabilityData.value.version
})

const url = computed(() => {
    if (!capabilityData.value) {
        throw new Error('WMS capabilities not loaded')
    }
    return capabilityData.value.Service.OnlineResource
})

const dimensions = computed(() => {
    const layerData = capabilityData.value.Capability.Layer.Layer
    const thisLayer = layerData.find(
        (_layer: WMSCapabilities['Capability']['Layer']['Layer']) =>
            _layer.Name === layer.dataset.id
    )
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

const { setVisibility, setZIndex, updateTimeDimension } = useOlWmsLayer(
    layer.dataset.id,
    layer.uuid,
    gutter.value,
    layer.opacity,
    url.value,
    version.value,
    layer.zIndex,
    initialTimestamp.value
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => layer.zIndex,
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
        if ('time' in layer.dimensions) {
            updateTimeDimension(layer.dimensions.time.currentValue)
        }
    },
    { deep: true }
)
</script>

<template>
    <slot />
</template>
