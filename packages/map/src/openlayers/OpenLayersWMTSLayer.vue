<script lang="ts" setup>
import { useLayerStore, type ServerLayer } from '@swissgeo/layers'
import type { Options as WMTSOptions } from 'ol/source/WMTS'
import { getLayerInfoFromWMTSCapabilities } from '@swissgeo/layers'

import log from '@swissgeo/log'
import { optionsFromCapabilities } from 'ol/source/WMTS'
/** Renders a WMTS layer on the map by configuring it through a getCapabilities XML file */

import { getLinksByProtocol } from '@/utils/recordUtils'

import useOlWmtsLayer from '../composables/olWMTSLayer.composable'
import type { WMTSCapabilities } from '@swissgeo/shared/ogc'

const layerStore = useLayerStore()

const { layer } = defineProps<{
    layer: ServerLayer
}>()

/** Extract the capabilities URL from the OGC Record */
const capabilityUrl = computed(() => {
    const links = layer.record.links

    const link = getLinksByProtocol(links, 'OGC:WMTS')[0]
    const href = link.href || link.uriTemplate

    if (!href) {
        throw new Error(
            `Faulty wmts record, neither href nor uriTemplate found: ${JSON.stringify(link)}`
        )
    }
    return encodeURIComponent(href)
})

// TODO ok here we have a bit of a tight coupling with the main package
const { data: capabilityData } = await useFetch<WMTSCapabilities>(
    `/api/v1/layers/wmtsConfig/${capabilityUrl.value}`
)

/** Retrieve the capabilities and then turn them into a options objects to be used by WMTS */
const options = computed((): WMTSOptions => {
    if (!capabilityData.value) {
        log.error(`Unable to fetch capabilities for ${capabilityUrl.value}`)
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
    layer.record.geocatId,
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
