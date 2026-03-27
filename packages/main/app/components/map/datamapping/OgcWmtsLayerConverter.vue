<script setup lang="ts">
import type { Dimension } from '@swissgeo/layers'
import type { Distribution, Service } from '@swissgeo/ogc'
import type { Options } from 'ol/source/WMTS'

import { processTimeInfo } from './processTimeInfo'
import { useOgcWmtsData } from './useOgcWmtsData'

// not destructuring these to keep the reactivity
const props = defineProps<{
    distribution: Distribution | null
    serviceData: Service | null
    layerId: string | null
}>()

const emit = defineEmits<{
    updateOptions: [{ options: Options }]
    updateTimeDimension: [dimension: Partial<Dimension>]
    updateOpacity: [opacity: number]
}>()

const distribution = computed(() => props.distribution)
const serviceData = computed(() => props.serviceData)
const layerId = computed(() => props.layerId)
const { timeInfo, options, defaultOpacity } = useOgcWmtsData(distribution, serviceData, layerId)

watch(timeInfo, () => {
    const dimension = processTimeInfo(timeInfo)
    emit('updateTimeDimension', dimension)
})

watch(
    defaultOpacity,
    () => {
        if (defaultOpacity.value !== null) {
            emit('updateOpacity', defaultOpacity.value)
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
