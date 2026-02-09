<script setup lang="ts">
import type { DatasetLayer } from '@swissgeo/layers'

import { useRecordsData } from '@swissgeo/ogc'
import WMSCapabilities from 'ol/format/WMSCapabilities'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'

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
