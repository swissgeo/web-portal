<script lang="ts" setup>
import type { Map } from 'ol'
import type { ShallowRef } from 'vue'

import { computed, inject } from 'vue'

import type { KMLLayer } from '@/types'

import useOlKMLLayer from '@/composables/olKMLLayer.composable'

const { layer } = defineProps<{
    layer: KMLLayer
}>()

const olMap = inject<ShallowRef<Map | undefined>>('olMap')

const layerRef = computed(() => layer)

useOlKMLLayer(layerRef, olMap)
</script>

<template>
    <slot />
</template>
