<script setup lang="ts">
/**
 * MapToolbox component contains some basic map tool that are displayed as button on the top right
 * map corner.
 *
 * By default the toolbox only contains the zoom in/out buttons
 */
import FullScreenButton from '@/uiComponents/toolboxButtons/FullScreenButton.vue'
import GeolocButton from '@/uiComponents/toolboxButtons/GeolocButton.vue'
import Toggle3dButton from '@/uiComponents/toolboxButtons/Toggle3dButton.vue'
import ZoomButtons from '@/uiComponents/toolboxButtons/ZoomButtons.vue'
import TimeSliderButton from './toolboxButtons/TimeSliderButton.vue'
//import useDrawingStore from '@/stores/drawing' Drawing it not here for now
import { useUiStore } from '@swissgeo/skeleton'

const {
    fullScreenButton = false,
    geolocButton = false,
    toggle3dButton = false,
    compassButton = false,
    /**
     * Tell the component if the map has a header, if set to true the buttons will be put right
     * below the header
     */
    hasHeader = true,
} = defineProps<{
    fullScreenButton?: boolean
    geolocButton?: boolean
    toggle3dButton?: boolean
    compassButton?: boolean
    hasHeader?: boolean
}>()

const uiStore = useUiStore()
//const drawingStore = useDrawingStore()
</script>

<template>
    <div
        class="toolbox-right absolute top-[1rem] right-[1rem] w-[40px] space-y-1"
        :class="{
            'dev-disclaimer-present': uiStore.hasDevSiteWarning,
            'fullscreen-mode': uiStore.fullscreenMode || !hasHeader,
            'drawing-mode': /*drawingStore.overlay.show*/ false,
        }"
        data-cy="toolbox-right"
    >
        <FullScreenButton />
        <GeolocButton :compass-button="compassButton" />
        <ZoomButtons />
        <Toggle3dButton />
        <TimeSliderButton />
        <slot />
    </div>
</template>

<style scoped>
/*@import '@/scss/media-query.mixin';
@import '@/scss/variables.module';

.toolbox-right {
    z-index: $zindex-map-toolbox;
    top: $header-height;
    &.dev-disclaimer-present {
        top: calc($header-height + $dev-disclaimer-height);
    }
    &.fullscreen-mode,
    &.dev-disclaimer-present.fullscreen-mode {
        top: 0;
    }
    &.drawing-mode,
    &.dev-disclaimer-present.drawing-mode {
        top: $drawing-tools-height-mobile;
    }
}

@include respond-above(lg) {
    .toolbox-right {
        top: 2 * $header-height;
        &.dev-disclaimer-present {
            top: calc(2 * $header-height + $dev-disclaimer-height);
        }
        &.drawing-mode,
        &.dev-disclaimer-present.drawing-mode {
            top: $header-height;
        }
    }
}

.hide-on-mobile {
    @include respond-below(phone) {
        display: none;
    }
}
    */
</style>
