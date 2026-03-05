<script setup lang="ts">
import type { Map } from 'ol'
import type { Ref } from 'vue'

import { computed, inject } from 'vue'

import type { WMSLayer } from '@/types/layers'

import useOlWmsLayer from '@/composables/olWMSLayer.composable'

const { layer } = defineProps<{
    layer: WMSLayer
}>()

const layerRef = computed(() => layer)

const olMap = inject<Ref<Map | undefined>>('olMap')

useOlWmsLayer(layerRef, olMap)
</script>

<template>
    <slot />
</template>
