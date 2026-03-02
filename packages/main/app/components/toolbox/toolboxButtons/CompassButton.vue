<script setup lang="ts">
import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'
import type MapEvent from 'ol/MapEvent'

const RESET_ANIMATION_DURATION_MS = 300

import { usePositionStore } from '@swissgeo/map'
import ToolBoxButton from '@/components/toolbox/toolboxButtons/ToolBoxButton.vue'

const dispatcher: ActionDispatcher = { name: 'OpenLayersCompassButton.vue' }

// FIXME disabled the eslint check here b/c it just isn't implemented yet
// eslint-disable-next-line
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
function isActive() {
    return false
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
    // positionStore.setAutoRotation(false, dispatcher)
    positionStore.setRotation(0, dispatcher)
    rotation.value = 0
    // Allow rotation updates again after animation completes
    setTimeout(() => {
        isResetting.value = false
    }, RESET_ANIMATION_DURATION_MS)
}

// FIXME
// eslint-disable-next-line
function onRotate(mapEvent: MapEvent): void {
    throw new Error('GEOLOCATION AND ROTATIONS ARE NOT YET IMPLEMENTED')
    // Ignore rotation updates during reset animation to prevent button from reappearing
    if (isResetting.value) {
        return
    }
    const newRotation = mapEvent.frameState?.viewState.rotation ?? rotation.value
    if (newRotation !== rotation.value) {
        rotation.value = newRotation
    }
}
</script>

<template>
    <!-- The rotation constraint of the openlayers view by default snaps to zero. This means that
    even if the angle is not normalized, it will automatically be set to zero if pointing to the
    north -->

    <ToolBoxButton
        title="compass button"
        :is-disabled="isDisabled()"
        :is-active="isActive()"
        iconName="Compass"
        :style="{ transform: `rotate(${rotation}rad)` }"
        @click="resetRotation()"
    />
</template>

<style scoped></style>
