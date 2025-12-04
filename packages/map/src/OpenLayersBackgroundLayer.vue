<script lang="ts" setup>
import type * as OGC from '../../../shared/types/ogc/records'
const { layerConfig } = defineProps<{ layerConfig: OGC.Feature }>()

const zIndex = computed(() => 1)
</script>

<template>
    <OpenLayersWMTSLayer
        :layer-config="layerConfig"
        :z-index="zIndex"
    />
</template>
