<script lang="ts" setup>
import type { ServerLayer } from '@swissgeo/layers'
import type { WMTSCapabilities } from '@swissgeo/shared/ogc'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

import { useLayerStore, getLayerInfoFromWMTSCapabilities } from '@swissgeo/layers'
import log from '@swissgeo/log'
/** Renders a WMTS layer on the map by configuring it through a getCapabilities XML file */
import { optionsFromCapabilities } from 'ol/source/WMTS'

import useOlWmtsLayer from '../composables/olWMTSLayer.composable'
import useRecordsData from '../composables/useRecordsData.composable'

const layerStore = useLayerStore()

const { layer } = defineProps<{
    layer: ServerLayer
}>()

const { capabilityUrl, serviceUrl } = await useRecordsData(layer, 'OGC:WMTS')

const { data: capabilityData } = await useFetch<WMTSCapabilities>(
    `/api/v1/layers/wmtsConfig/${capabilityUrl.value}`
)

/** Retrieve the capabilities and then turn them into a options objects to be used by WMTS */
const options = computed((): WMTSOptions => {
    if (!capabilityData.value) {
        log.error(`Unable to fetch capabilities for ${serviceUrl.value}`)
        throw new Error()
    }

    const options = optionsFromCapabilities(capabilityData.value, {
        layer: layer.record.id,
    })

    if (!options) {
        throw new Error('Unable to get options from capabilities')
    }

    return options
})

const { initialize, setVisibility, setZIndex } = useOlWmtsLayer(
    layer.record.id,
    layer.uuid,
    options.value,
    layer.opacity,
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
    initialize()
    updateLayerInfo()
})

function updateLayerInfo() {
    const info = getLayerInfoFromWMTSCapabilities(capabilityData.value, layer.record.id)
    layerStore.setLayerInfo(layer.uuid, info)
}
</script>

<template>
    <slot />
</template>
