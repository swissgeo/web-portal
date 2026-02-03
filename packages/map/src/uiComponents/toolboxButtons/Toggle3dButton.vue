<script setup lang="ts">
/*
import GeoadminTooltip from '@swissgeo/tooltip'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ActionDispatcher } from '@/stores/types'

import useCesiumStore from '@/stores/cesium'
import useDrawingStore from '@/stores/drawing'
import usePrintStore from '@/stores/print'

const dispatcher: ActionDispatcher = { name: 'Toggle3dButton.vue' }

const { t } = useI18n()
const cesiumStore = useCesiumStore()
const drawingStore = useDrawingStore()
const printStore = usePrintStore()
const tooltipContent = computed(() => {
    if (webGlIsSupported.value) {
        return t(`tilt3d_${cesiumStore.active ? 'active' : 'inactive'}`)
    }
    return t('3d_render_error')
})




*/
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCube } from '@fortawesome/free-solid-svg-icons'

// temporary variable. This is meant to disable the button. When the 3d view is implemented,
// we'll need to define in which circumstances it is enabled.
const disabler = false

const webGlIsSupported = ref(false)

onMounted(() => {
    webGlIsSupported.value = checkWebGlSupport()
})

function checkWebGlSupport(): boolean {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return gl instanceof WebGLRenderingContext
}

function toggle3d() {
    throw new Error('3D BUTTON IS NOT IMPLEMENTED AT THE MOMENT')
    if (webGlIsSupported.value && disabler /*!drawingStore.overlay.show*/) {
        // cesiumStore.set3dActive(!cesiumStore.active, dispatcher)
        // printStore.setPrintSectionShown(false, dispatcher)
        return 'You were not supposed to be in there'
    }
}
</script>

<template>
    <!--<GeoadminTooltip
        placement="left"
        :tooltip-content="tooltipContent"
    >
    -->
    <!--
    those are the additional classes when 3d is fully active
     -->
    <button
        ref="toggle3DButton"
        class="toolbox-button"
        type="button"
        :class="{
            /*active: cesiumStore.active,*/
            disabled: !webGlIsSupported || disabler /*drawingStore.overlay.show*/,
        }"
        data-cy="3d-button"
        @click="toggle3d"
    >
        <FontAwesomeIcon
            :icon="faCube"
            size="lg"
        />
    </button>
    <!--</GeoadminTooltip>-->
</template>

<style scoped></style>
