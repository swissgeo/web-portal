<script setup lang="ts">
import type { DatasetLayer } from '@swissgeo/layers'

import { useLayerStore } from '@swissgeo/layers'
import { useRecordsData } from '@swissgeo/ogc'
import WMSCapabilities from 'ol/format/WMSCapabilities'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'
import type { Dimension } from '@swissgeo/layers'

const layerStore = useLayerStore()

type WMSCapabilityType = ReturnType<WMSCapabilities['read']>

const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const gutter = computed(() => {
    return 0
})

const { capabilityUrl } = await useRecordsData(layer.dataset, 'OGC:WMS')

const { data } = await useFetch<string>(capabilityUrl.value)

const capabilityData = computed((): WMSCapabilityType => {
    if (!data.value) {
        throw new Error('Unable to read WMS capabilities')
    }

    const parser = new WMSCapabilities()
    const capabilities = parser.read(data.value)

    return capabilities
})

/* Version to be used in the WMS */
const version = computed(() => capabilityData.value.version)

/* URL to the WMS */
const url = computed(() => capabilityData.value.Service.OnlineResource)

const dimensions = computed(() => {
    const layerData = capabilityData.value.Capability.Layer.Layer
    const thisLayer = layerData.find(
        (_layer: WMSCapabilities['Capability']['Layer']['Layer']) =>
            _layer.Name === layer.dataset.id
    )
    if ('Dimension' in thisLayer) {
        return thisLayer.Dimension
    }
    return null
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
