<script lang="ts" setup>
import log from '@swissgeo/log'

import useOlVectorLayer from './composables/olVectorLayer.composable'

const layerId = 'ch.swisstopo.base.vt'

const url = computed(
    () => `https://vectortiles.geo.admin.ch/styles/ch.swisstopo.leichte-basiskarte.vt/style.json`
)

const { data } = await useFetch<string>(url)

const style = computed(() => {
    if (!data.value) {
        log.error(`Unable to load the Vector Style from ${url}`)
        return
    }
    return JSON.parse(data.value)
})

const { setVisibility, setZIndex } = useOlVectorLayer(layerId, 1, style.value)
</script>

<template>
    <slot />
</template>
