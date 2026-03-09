<script lang="ts" setup>
import type { Map } from 'ol'
import type { ShallowRef } from 'vue'

import { computed, inject } from 'vue'

import type { WMTSLayer } from '@/types/layers'

import useOlWmtsLayer from '@/composables/olWMTSLayer.composable'

const { layer } = defineProps<{
    layer: WMTSLayer
}>()

const layerRef = computed(() => layer)

const olMap = inject<ShallowRef<Map | undefined>>('olMap')

useOlWmtsLayer(layerRef, olMap)
</script>

<template>
    <slot />
</template>
