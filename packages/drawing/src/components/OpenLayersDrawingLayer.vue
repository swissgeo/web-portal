<script lang="ts" setup>
import type { Layer } from '@swissgeo/layers'
import type { Map } from 'ol'
import type { ShallowRef } from 'vue'

import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { useOlDrawing } from '@/composables/olDrawing.composable'

const { layer, zIndex } = defineProps<{
    layer: Layer
    zIndex: number
}>()

const { t } = useI18n()
const olMap = inject<ShallowRef<Map | undefined>>('olMap')
const layerRef = computed(() => layer)
const zIndexRef = computed(() => zIndex)

const { showHoverHint, hoverHintText, hoverHintX, hoverHintY } = useOlDrawing(
    layerRef,
    zIndexRef,
    olMap,
    { translate: (key, params) => t(key, params ?? {}) }
)
</script>

<template>
    <slot />

    <!-- Teleport to body so position:fixed works relative to the browser window, not OL's transformed viewport -->
    <Teleport to="body">
        <div
            v-if="showHoverHint"
            :style="{
                position: 'fixed',
                left: `${hoverHintX}px`,
                top: `${hoverHintY}px`,
                zIndex: '9997',
                backgroundColor: 'rgba(55, 65, 81, 0.92)',
                color: '#ffffff',
            }"
            class="pointer-events-none rounded px-2 py-1 text-xs"
        >
            {{ hoverHintText }}
        </div>
    </Teleport>
</template>
