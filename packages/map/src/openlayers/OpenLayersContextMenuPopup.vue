<script setup lang="ts">
import type { Map as OlMap } from 'ol'
import type { Ref } from 'vue'

import Overlay from 'ol/Overlay'
import { inject, ref, watch, onMounted, onUnmounted } from 'vue'

import { useMapContextMenu } from '../composables/useOlMapContextMenu.composable'

const olMap = inject<Ref<OlMap | undefined>>('olMap')
const { isVisible, coordinate, close } = useMapContextMenu()

const popupEl = ref<HTMLDivElement>()
let overlay: Overlay | null = null

onMounted(() => {
    overlay = new Overlay({
        element: popupEl.value,
        positioning: 'bottom-center',
        offset: [0, -10],
        stopEvent: true,
    })
    watch(
        () => olMap?.value,
        (map) => {
            if (map) {
                map.addOverlay(overlay!)
            }
        },
        { immediate: true }
    )
})

watch([isVisible, coordinate], ([visible, coord]) => {
    if (visible && coord) {
        overlay?.setPosition(coord)
    } else {
        overlay?.setPosition(undefined)
    }
})

onUnmounted(() => olMap?.value?.removeOverlay(overlay!))
</script>

<template>
    <div
        ref="popupEl"
        class="bg-white"
    >
        <div
            v-if="isVisible"
            @click.stop
        >
            <slot
                :coordinate="coordinate"
                :close="close"
            />
        </div>
    </div>
</template>
