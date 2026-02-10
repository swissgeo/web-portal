<script lang="ts" setup>
import type { DatasetLayer } from '@swissgeo/layers'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

import { useLayerStore } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { useRecordsData } from '@swissgeo/ogc'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { optionsFromCapabilities } from 'ol/source/WMTS'

import useOlWmtsLayer from '@/composables/olWMTSLayer.composable'

import { getTimeInfoFromWMTSCapabilities } from '../utils/timeUtils'
import type { Dimension } from '@swissgeo/layers'

const layerStore = useLayerStore()

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

const dimensions = computed(() => {
    if (!capabilityData.value) {
        // error will already be thrown in the other computed
        return undefined
    }

    // TODO let's not do this twice!
    const wmtsParser = new WMTSCapabilities()
    const capabilities = wmtsParser.read(capabilityData.value)

    const capabilityOfLayer = capabilities.Contents.Layer.find(
        (layerEntry: WMTSCapabilities['Contents']['Layer']) =>
            layerEntry.Identifier === layer.dataset.id
    )

    if (!capabilityOfLayer) {
        return undefined
    }

    return capabilityOfLayer.Dimension
})

const timeInfo = computed(() => {
    const { defaultTime, availableTimes } = getTimeInfoFromWMTSCapabilities(dimensions.value)
    return { defaultTime, availableTimes }
})

const initialTimestamp = computed(() => {
    return timeInfo.value.defaultTime
})

const { initialize, setVisibility, setZIndex, updateTimeDimension } = useOlWmtsLayer(
    layer.dataset.id,
    layer.uuid,
    options.value,
    defaultOpacityFromStyle.value,
    layer.zIndex,
    initialTimestamp.value
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
    () => layer.dimensions,
    () => {
        if (
            layer.dimensions &&
            'time' in layer.dimensions &&
            layer.dimensions.time?.currentValue !== undefined &&
            layer.dimensions.time?.currentValue !== null
        ) {
            updateTimeDimension(layer.dimensions.time.currentValue)
        }
    },
    { deep: true }
)

onMounted(() => {
    initialize()
})
</script>

<template>
    <slot />
</template>
