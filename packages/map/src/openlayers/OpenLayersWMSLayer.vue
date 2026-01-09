<script setup lang="ts">
import type { ServerLayer } from '@swissgeo/layers'

import { useLayerStore, getLayerInfoFromWMSCapabilities } from '@swissgeo/layers'
import log from '@swissgeo/log'
import WMSCapabilities from 'ol/format/WMSCapabilities'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'
import useLayerData from '@/composables/useLayerData.composable'

type WMSCapabilityType = ReturnType<WMSCapabilities['read']>

const layerStore = useLayerStore()

const { layer } = defineProps<{
    layer: ServerLayer
}>()

const gutter = computed(() => {
    return 0
})

const { capabilityUrl } = await useLayerData(layer.record.id, 'OGC:WMS')

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
    layer.record.id,
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

onMounted(() => {
    updateLayerInfo()
})

function updateLayerInfo() {
    try {
        const info = getLayerInfoFromWMSCapabilities(capabilityData.value, layer.record.id)
        layerStore.setLayerInfo(layer.uuid, info)
    } catch (error) {
        log.warn(
            `Unable to find layer ${layer.record.id} in wms capabilities of ${capabilityUrl.value}`,
            { messages: [error] }
        )
    }
}
</script>

<template>
    <slot />
</template>
