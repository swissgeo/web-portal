<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'

import log from '@swissgeo/log'

import useOlVectorLayer from '../composables/olVectorLayer.composable'

const { layer } = defineProps<{
    layer: Layer
}>()

const url = computed(() => `/api/v1/layers/swissgeo/vectorTest`)

const { data } = await useFetch<string>(url)

const style = computed(() => {
    if (!data.value) {
        log.error(`Unable to load the Vector Style from ${url.value}`)
        return
    }
    return data.value
})

const { setVisibility, setZIndex } = useOlVectorLayer(layer.dataset.id, 1, style.value)

watch(
    () => layer.isVisible,
    (newVisibility) => setVisibility(newVisibility)
)

watch(
    () => layer.zIndex,
    (newZIndex) => setZIndex(newZIndex)
)
</script>

<template>
    <slot />
</template>
