<script setup lang="ts">
//import GeoadminTooltip from '@swissgeo/tooltip'

import type { ActionDispatcher } from '@/stores/types'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons'
import OpenLayersCompassButton from '@/openlayers/OpenLayersCompassButton.vue'
import RecenterButton from '@/uiComponents/toolboxButtons/RecenterButton.vue'
//import useCesiumStore from '@/stores/cesium'
//import useGeolocationStore from '@/stores/geolocation'
import usePositionStore from '@/stores/position'

const dispatcher: ActionDispatcher = { name: 'GeolocButton.vue' }

const { compassButton = false } = defineProps<{
    compassButton?: boolean
}>()

//const geolocationStore = useGeolocationStore()
const geolocationStoreMockup = {
    denied: true,
    active: false,
    toggleGeolocation: (dispatcher: ActionDispatcher) => {
        throw new Error('Toggle Geolocation is not implemented yet')
        return 'Toggle Geolocation is not implemented yet ' + dispatcher.name
    },
    setGeolocationTracking: (bool: boolean, dispatcher: ActionDispatcher) => {
        throw new Error('Setting Geolocation tracking is not implemented yet')
        if (bool) {
            return dispatcher
        }
        return 'false'
    },
}
//const cesiumStore = useCesiumStore()
const positionStore = usePositionStore()
const { t } = useI18n()

/*const tooltipContent = computed(() => {
    let key
    if (geolocationStoreMockup.denied) {
        key = 'geoloc_permission_denied'
    } else if (geolocationStoreMockup.active) {
        key = 'geoloc_stop_tracking'
    } else {
        key = 'geoloc_start_tracking'
    }
    return t(key)
})
*/
function toggleGeolocation(): void {
    // Simply toggle geolocation on/off
    geolocationStoreMockup.toggleGeolocation(dispatcher)

    // If turning off geolocation, also disable tracking and auto-rotation
    if (!geolocationStoreMockup.active) {
        geolocationStoreMockup.setGeolocationTracking(false, dispatcher)
        if (positionStore.autoRotation) {
            positionStore.setRotation(0, dispatcher)
            positionStore.setAutoRotation(false, dispatcher)
        }
    }
}
</script>

<template>
    <div
        ref="geolocationButton"
        class="geoloc-button-div"
    >
        <button
            class="toolbox-button d-print-none"
            type="button"
            :disabled="geolocationStoreMockup.denied"
            :class="{
                active: geolocationStoreMockup.active,
                disabled: geolocationStoreMockup.denied,
            }"
            data-cy="geolocation-button"
            @click="toggleGeolocation"
        >
            <span class="fa-layers fa-fw h-100 w-100">
                <FontAwesomeIcon
                    :icon="faLocationArrow"
                    transform="shrink-2 down-1 left-1"
                />
            </span>
        </button>
        <!-- Recenter button: Shows when geolocation is active - enables tracking mode -->
        <RecenterButton />
        <!-- Compass button: Shows when map is rotated, or when auto-rotation is enabled (for orientation feedback) -->
        <OpenLayersCompassButton
            v-if="/*!cesiumStore.active &&*/ compassButton"
            :hide-if-north="geolocationStoreMockup.active ? !positionStore.autoRotation : true"
        />
    </div>
</template>

<style scoped></style>
