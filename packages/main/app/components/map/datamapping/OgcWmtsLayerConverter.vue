<script setup lang="ts">
import type { Dimension } from '@swissgeo/layers'
import type { Distribution, Service } from '@swissgeo/ogc'
import type { Options } from 'ol/source/WMTS'

import { useStyle, useWmtsCapabilities } from '@swissgeo/ogc'

import { defaultOpacityFromStyle } from './defaultFromOpacity'
import { processTimeInfo } from './processTimeInfo'

// not destructuring these to keep the reactivity
const props = defineProps<{
    distribution: Distribution | null
    serviceData: Service | null
    layerId: string | null
}>()

const { styleData } = useStyle(toRef(props, 'distribution'))
const { wmtsData } = useWmtsCapabilities(toRef(props, 'serviceData'), toRef(props, 'layerId'))

const options = computed(() => wmtsData.value?.options || null)
const dimensions = computed(() => wmtsData.value?.dimensions || null)

const timeInfo = computed(() => getTimeInfoFromWMTSCapabilities(dimensions.value))

const emit = defineEmits<{
    updateOptions: [{ options: Options }]
    updateTimeDimension: [dimension: Partial<Dimension>]
    updateOpacity: [opacity: number]
}>()

watch(timeInfo, () => {
    const dimension = processTimeInfo(timeInfo)
    emit('updateTimeDimension', dimension)
})

watch(
    styleData,
    (newStyle, oldStyle) => {
        // when we're going from no style to some style, we want to execute this
        // otherwise we don't, as this will prserve the opacity as is it in the store
        if (!oldStyle && newStyle) {
            const defaultOpacity = defaultOpacityFromStyle(newStyle)
            emit('updateOpacity', defaultOpacity)
        }
    },
    { immediate: true }
)

watch(
    options,
    () => {
        if (options.value) {
            emit('updateOptions', { options: options.value })
        }
    },
    { immediate: true }
)
</script>

<template><slot /></template>
