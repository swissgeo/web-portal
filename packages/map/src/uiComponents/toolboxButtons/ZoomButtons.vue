<script setup lang="ts">
//import type { Viewer } from 'cesium'

import log from '@swissgeo/log'
//import GeoadminTooltip from '@swissgeo/tooltip'
//import { Ray } from 'cesium'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleMinus } from '@fortawesome/free-solid-svg-icons'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'

import type { ActionDispatcher } from '@/stores/types'

//import useCesiumStore from '@/stores/cesium'
import usePositionStore from '@/stores/position'

const dispatcher: ActionDispatcher = { name: 'ZoomButtons.vue' }

const { t } = useI18n()
//const cesiumStore = useCesiumStore()
const positionStore = usePositionStore()

const step = computed(() => positionStore.resolution * 200)

/*function moveCamera(distance: number) {
    const viewer = inject<Viewer | undefined>('viewer')
    if (!viewer) {
        log.error({
            title: 'ZoomButton.vue',
            messages: ['3D viewer not initialized, cannot hook zoom buttons to it'],
        })
        throw new Error('3D viewer not initialized, cannot hook zoom buttons to it')
    }

    const camera = viewer.scene?.camera
    if (camera) {
        camera.flyTo({
            destination: Ray.getPoint(new Ray(camera.position, camera.direction), distance),
            orientation: {
                heading: camera.heading,
                pitch: camera.pitch,
                roll: camera.roll,
            },
            duration: 0.25,
        })
    }
}
*/
function increaseZoom() {
    /*if (cesiumStore.active) {
        moveCamera(step.value)
    } else {
        positionStore.increaseZoom(dispatcher)
    }*/
    positionStore.increaseZoom(dispatcher)
}

function decreaseZoom() {
    /*if (cesiumStore.active) {
        moveCamera(-step.value)
    } else {
        positionStore.decreaseZoom(dispatcher)
    }*/
    positionStore.decreaseZoom(dispatcher)
}
</script>

<template>
    <div id="zoomButtons">
        <!-- Geoadmin tooltips are wrapping around buttons-->
        <button
            ref="zoomInButton"
            class="toolbox-button d-print-none -500 mb-1 h-[40px] w-[40px] rounded-[20px] bg-black text-white hover:bg-blue-500"
            data-cy="zoom-in"
            @click="increaseZoom"
        >
            <FontAwesomeIcon
                :icon="faCirclePlus"
                size="lg"
            />
        </button>

        <button
            ref="zoomOutButton"
            class="toolbox-button d-print-none -500 h-[40px] w-[40px] rounded-[20px] bg-black text-white hover:bg-blue-500"
            data-cy="zoom-out"
            @click="decreaseZoom"
        >
            <FontAwesomeIcon
                :icon="faCircleMinus"
                size="lg"
            />
        </button>
    </div>
</template>

<style scoped></style>
