<script lang="ts" setup>
import type { Feature as OGCFeature, OGCRecords, Service } from '@swissgeo/shared/ogc'
import type { WMTSCapabilities } from '@swissgeo/shared/ogc'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

import { useLayerStore, type ServerLayer } from '@swissgeo/layers'
import { getLayerInfoFromWMTSCapabilities } from '@swissgeo/layers'
import log from '@swissgeo/log'
/** Renders a WMTS layer on the map by configuring it through a getCapabilities XML file */
import { optionsFromCapabilities } from 'ol/source/WMTS'

import { getDataServiceLinks } from '@/utils/recordUtils'

import useOlWmtsLayer from '../composables/olWMTSLayer.composable'

const layerStore = useLayerStore()

const { layer } = defineProps<{
    layer: ServerLayer
}>()

const layerId = computed(() => layer.record.id)

const distributionLink = computed(() => {
    const links = layer.record.links
    for (const link of links) {
        if (link.rel?.toLowerCase() === 'distributions') {
            return link.href
        }
    }
})

const { data: distributionData } = await useFetch<OGCRecords>(
    `/api/v1/layers/${distributionLink.value}`
)

const wmtsFeature = computed((): OGCFeature => {
    if (!distributionData.value) {
        throw new Error('Unable to load distribution data')
    }

    const features = distributionData.value.features

    for (const feature of features) {
        if (!feature.properties) {
            break // go to exception below
        }
        if (feature.properties.protocol === 'OGC:WMTS') {
            return feature
        }
    }

    throw new Error(
        `Unable to find WMTS feature in distribution for ${layerId.value}. ` +
            `This layer probably shouldn't be treated as a WMTS layer`
    )
})

/** Extract the capabilities URL from the OGC Record */
const serviceUrl = computed(() => {
    const links = wmtsFeature.value.links

    const link = getDataServiceLinks(links)[0]
    if (!link) {
        throw new Error("Unable to find link for rel type 'dataservice'")
    }
    const href = link.href

    if (!href) {
        throw new Error(
            `Faulty wmts record, neither href nor uriTemplate found: ${JSON.stringify(link)}`
        )
    }
    return href
})

// TODO ok here we have a bit of a tight coupling with the main package
const { data: serviceData } = await useFetch<Service>(`/api/v1/layers/service/${serviceUrl.value}`)

const capabilityUrl = computed(() => {
    const link = serviceData.value.linkTemplates[0]

    if (!link) {
        throw new Error('Unable to extract link to capabilities for the service')
    }

    // TODO make it work with more flexible versions for the link
    const uri = link.uriTemplate.replace('{EPSG}', '2056')
    console.log({ uri })
    return encodeURIComponent(uri)
})

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
