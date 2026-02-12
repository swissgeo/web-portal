<script setup lang="ts">
import type MapEvent from 'ol/MapEvent'

const RESET_ANIMATION_DURATION_MS = 300

import type { ActionDispatcher } from '@swissgeo/map'

import { usePositionStore } from '@swissgeo/map'
import { LucideIcon } from '@swissgeo/skeleton'

const dispatcher: ActionDispatcher = { name: 'OpenLayersCompassButton.vue' }

const { hideIfNorth = false } = defineProps<{
    hideIfNorth?: boolean
}>()

// in the long run, we should have a composable somewhere with the olMap logic, and this button
// will only send a "reset rotation" signal and show the current rotation of the map.
/*const olMap = inject<Map>('olMap')
if (!olMap) {
    log.error('OpenLayersMap is not available')
    throw new Error('OpenLayersMap is not available')
}*/

const positionStore = usePositionStore()
const { t } = useI18n()

const rotation = ref(-Math.PI / 4)
const isResetting = ref(false)

function isDisabled() {
    return true
}

function addRotationListener() {
    //olMap.on('postrender', onRotate)
}
function removeRotationListener() {
    //olMap.un('postrender', onRotate)
}
onMounted(() => {
    addRotationListener()
})

onUnmounted(() => {
    removeRotationListener()
})

function resetRotation(): void {
    throw new Error('ROTATION IS NOT IMPLEMENTED YET')
    isResetting.value = true
    positionStore.setAutoRotation(false, dispatcher)
    positionStore.setRotation(0, dispatcher)
    rotation.value = 0
    // Allow rotation updates again after animation completes
    setTimeout(() => {
        isResetting.value = false
    }, RESET_ANIMATION_DURATION_MS)
}

function onRotate(mapEvent: MapEvent): void {
    throw new Error('GEOLOCATION AND ROTATIONS ARE NOT YET IMPLEMENTED')
    // Ignore rotation updates during reset animation to prevent button from reappearing
    if (isResetting.value) {
        return
    }
    const newRotation = mapEvent.frameState?.viewState.rotation
    if (newRotation !== undefined && newRotation !== rotation.value) {
        rotation.value = newRotation
    }
}
</script>

<template>
    <!-- The rotation constraint of the openlayers view by default snaps to zero. This means that
    even if the angle is not normalized, it will automatically be set to zero if pointing to the
    north -->
    <button
        class="recenter-button h-[40px] w-[40px] rounded-[20px] bg-black text-white"
        :disabled="isDisabled()"
        data-cy="compass-button"
        type="button"
        :title="t('rotate_reset')"
        @click="resetRotation"
    >
        <LucideIcon
            name="Compass"
            :size="40"
            :style="{ transform: `rotate(${rotation}rad)` }"
        />
        <!-- SVG icon adapted from "https://www.svgrepo.com/svg/883/compass" (and greatly
            simplified the code). Original icon was liscensed under the CCO liscense. -->
        <!--<svg
            class="compass-button-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-100 -240 200 480"
            :style="{ transform: `rotate(${rotation}rad)` }"
        >
            <polygon
                class="south-arrow"
                points="-100,0 100,0 0,240"
            />
            <polygon
                class="north-arrow"
                points="-100,0 100,0 0,-240"
            />
        </svg>
        -->
    </button>
</template>

<style scoped></style>
