<script setup lang="ts">
import type { DatasetLayer } from '@swissgeo/layers'

import WMSCapabilities from 'ol/format/WMSCapabilities'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'
import useLayerData from '@/composables/useLayerData.composable'

type WMSCapabilityType = ReturnType<WMSCapabilities['read']>

const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const gutter = computed(() => {
    return 0
})

const { capabilityUrl } = await useLayerData(layer.dataset.id, 'OGC:WMS')

const { data } = await useFetch<string>(`/api/v1/layers/wmsConfig/${capabilityUrl.value}`)

const capabilityData = computed((): WMSCapabilityType => {
    if (!data.value) {
        throw new Error('Unable to read WMS capabilities')
    }
    return data.value
})

const version = computed(() => capabilityData.value.version)

const url = computed(() => capabilityData.value.Service.OnlineResource)

const { setVisibility, setZIndex } = useOlWmsLayer(
    layer.dataset.id,
    layer.uuid,
    gutter.value,
    layer.opacity,
    url.value,
    version.value,
    layer.zIndex
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
</script>

<template>
    <slot />
</template>
