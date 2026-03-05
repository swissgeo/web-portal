<script lang="ts" setup>
import type { Map } from 'ol'
import type { Ref } from 'vue'

import { computed, inject } from 'vue'

import type { VectorLayer } from '@/types/layers'

import useOlVectorLayer from '../composables/olVectorLayer.composable'

const { layer } = defineProps<{
    layer: VectorLayer
}>()

const layerRef = computed(() => layer)

const olMap = inject<Ref<Map | undefined>>('olMap')

useOlVectorLayer(layerRef, olMap)
</script>

<template>
    <slot />
</template>
