<script setup lang="ts">
import type { Dimension } from '@swissgeo/layers'
import type { Distribution, Service } from '@swissgeo/ogc'

import { useStyle, useWmsCapabilities } from '@swissgeo/ogc'

import { defaultOpacityFromStyle } from './defaultFromOpacity'
import { processTimeInfo } from './processTimeInfo'

const { locale } = useI18n()

// not destructuring these to keep the reactivity
const props = defineProps<{
    distribution: Distribution | null
    serviceData: Service | null
    layerId: string | null
}>()

const { styleData } = useStyle(toRef(props, 'distribution'))
const { wmsData } = useWmsCapabilities(toRef(props, 'serviceData'), toRef(props, 'layerId'))
const dimensions = computed(() => wmsData.value?.dimensions || null)
const timeInfo = computed(() => getTimeInfoFromWMSCapabilities(dimensions.value))

const capabilities = computed(() => wmsData?.value?.capabilities)
const currentLang = computed(() => locale.value.toLowerCase())

const url = computed(() => capabilities.value?.Service.OnlineResource)
const version = computed(() => capabilities.value?.version)

export type WMSLayerData = {
    url: Ref<string>
    gutter: number
    version: Ref<string>
    lang: string // TODO also ref?
}

const emit = defineEmits<{
    updateData: [WMSLayerData]
    updateTimeDimension: [dimension: Partial<Dimension>]
    updateOpacity: [opacity: number]
}>()

const wmsLayerData = ref<WMSLayerData>()

watch(timeInfo, () => {
    const dimension = processTimeInfo(timeInfo)
    emit('updateTimeDimension', dimension)
})

watch(
    styleData,
    () => {
        if (styleData.value) {
            const defaultOpacity = defaultOpacityFromStyle(styleData.value)
            emit('updateOpacity', defaultOpacity)
        }
    },
    { immediate: true }
)

watch(
    () => wmsData.value,
    () => {
        wmsLayerData.value = {
            url,
            gutter: 0,
            version,
            lang: currentLang.value,
        }
    }
)

watch(currentLang, () => {
    if (wmsLayerData.value) {
        wmsLayerData.value = {
            ...wmsLayerData.value,
            lang: currentLang.value,
        }
    }
})

watch(wmsLayerData, () => {
    if (wmsLayerData.value) {
        emit('updateData', wmsLayerData.value)
    }
})
</script>

<template><slot /></template>
