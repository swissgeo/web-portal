<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

import log from '@swissgeo/log'
import { useRecordsData } from '@swissgeo/ogc'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { optionsFromCapabilities } from 'ol/source/WMTS'

import useOlWmtsLayer from '@/composables/olWMTSLayer.composable'

const { layer } = defineProps<{
    layer: DatasetLayer
}>()

const { capabilityUrl, defaultOpacityFromStyle } = await useRecordsData(layer.dataset, 'OGC:WMTS')

const { data: capabilityData } = await useFetch<WMTSCapabilities>(capabilityUrl.value)

/** Retrieve the capabilities and then turn them into a options objects to be used by WMTS */
const options = computed((): WMTSOptions => {
    if (!capabilityData.value) {
        log.error(`Unable to fetch capabilities for ${capabilityUrl.value}`)
        throw new Error()
    }

    const wmtsParser = new WMTSCapabilities()
    const capabilities = wmtsParser.read(capabilityData.value)

    const options = optionsFromCapabilities(capabilities, {
        layer: layer.dataset.id,
    })

    log.debug(`Successfully derived options for ${layer.dataset.id}`)

    if (!options) {
        throw new Error('Unable to get options from capabilities')
    }

    return options
})

const { initialize, setVisibility, setZIndex } = useOlWmtsLayer(
    layer.dataset.id,
    layer.uuid,
    options.value,
    defaultOpacityFromStyle.value,
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
})
</script>

<template>
    <slot />
</template>
