<script lang="ts" setup>
import type { DatasetLayer, Dimension } from '@swissgeo/layers'
import type { Options as WMTSOptions } from 'ol/source/WMTS'

import { useLayerStore } from '@swissgeo/layers'
import log from '@swissgeo/log'
import { useRecordsData } from '@swissgeo/ogc'
import { useFetch } from '@vueuse/core'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'
import { optionsFromCapabilities } from 'ol/source/WMTS'
import { computed, onMounted, watch } from 'vue'

import useOlWmtsLayer from '@/composables/olWMTSLayer.composable'

import type { WMTSLayer } from './types'

import { getTimeInfoFromWMTSCapabilities } from '../utils/timeUtils'

const layerStore = useLayerStore()

const props = defineProps<{
    layer: DatasetLayer
    zIndex: number
}>()

const { capabilityUrl, defaultOpacityFromStyle } = await useRecordsData(
    props.layer.dataset,
    'OGC:WMTS'
)

// Fetch capabilities XML directly from external server as raw text
const { data } = await useFetch<string>(capabilityUrl.value)

const parsedCapabilities = computed(() => {
    if (!data.value) {
        log.error(`Unable to fetch capabilities for ${capabilityUrl.value}`)
        throw new Error()
    }

    const wmtsParser = new WMTSCapabilities()
    return wmtsParser.read(data.value)
})

/** Retrieve the capabilities and then turn them into a options objects to be used by WMTS */
const options = computed((): WMTSOptions => {
    const capabilities = parsedCapabilities.value

    const options = optionsFromCapabilities(capabilities, {
        layer: props.layer.dataset.id,
    })

    log.debug(`Successfully derived options for ${props.layer.dataset.id}`)

    if (!options) {
        throw new Error('Unable to get options from capabilities')
    }

    return options
})

const dimensions = computed(() => {
    const capabilities = parsedCapabilities.value

    const capabilityOfLayer = capabilities.Contents.Layer.find(
        (layerEntry: WMTSLayer) => layerEntry.Identifier === props.layer.dataset.id
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

const { initialize, setVisibility, setZIndex, updateTimeDimension, setOpacity } = useOlWmtsLayer(
    props.layer.dataset.id,
    props.layer.uuid,
    options.value,
    defaultOpacityFromStyle.value,
    props.zIndex,
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
        layerStore.setDimension('time', props.layer.uuid, dimension)
    },
    { immediate: true }
)

watch(
    () => props.layer.isVisible,
    (newValue: boolean) => {
        setVisibility(newValue)
    }
)

watch(
    () => props.zIndex,
    (newZIndex: number) => {
        setZIndex(newZIndex)
    }
)

watch(
    () => props.layer.dimensions,
    () => {
        if (
            props.layer.dimensions &&
            'time' in props.layer.dimensions &&
            props.layer.dimensions.time?.currentValue !== undefined &&
            props.layer.dimensions.time?.currentValue !== null
        ) {
            updateTimeDimension(props.layer.dimensions.time.currentValue)
        }
    },
    { deep: true }
)

watch(
    () => props.layer.opacity,
    (newOpacity: number) => {
        setOpacity(newOpacity)
    }
)

onMounted(() => {
    initialize()
})
</script>

<template>
    <slot />
</template>
