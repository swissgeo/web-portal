<script setup lang="ts">
import type { ServerLayer } from '@swissgeo/layers'
import WMSCapabilities from 'ol/format/WMSCapabilities'

import useOlWmsLayer from './composables/olWMSLayer.composable'

type WMSCapabilityType = ReturnType<WMSCapabilities['read']>

const { layer } = defineProps<{
    layer: ServerLayer
}>()

const gutter = computed(() => {
    return 0
})

/** Extract the capabilities URL from the OGC Record */
const capabilityUrl = computed(() => {
    const links = layer.record.links

    const link = getLinksByProtocol(links, 'OGC:WMS')[0]
    const href = link.href || link.uriTemplate
    if (!href) {
        throw new Error(
            `Faulty wms record, neither href nor uriTemplate found: ${JSON.stringify(link)}`
        )
    }

    return encodeURIComponent(href)
})

// TODO here we have a bit of a tight coupling with the main package
const { data } = await useFetch<string>(`/api/v1/layers/wmsConfig/${capabilityUrl.value}`)

const capabilityData = computed((): WMSCapabilityType => {
    return JSON.parse(data.value)
})

const version = computed(() => capabilityData.value.version)

const url = computed(() => capabilityData.value.Service.OnlineResource)

const { setVisibility, setZIndex } = useOlWmsLayer(
    layer.record.id,
    layer.record.geocatId,
    gutter.value,
    layer.opacity,
    url.value,
    version.value,
    layer.zIndex
)

watch(
    () => layer.isVisible,
    (newValue: boolean) => {
        console.log('toggling visibility')
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
