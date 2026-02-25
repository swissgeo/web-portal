<script setup lang="ts">
import type { SingleCoordinate } from '@swissgeo/coordinates'
import type { ActionDispatcher } from '@swissgeo/shared/action-dispatcher'
import type { Map } from 'ol'

import log from '@swissgeo/log'
import MousePosition from 'ol/control/MousePosition'
import {
    computed,
    inject,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    toValue,
    useTemplateRef,
} from 'vue'

import usePositionStore from '@/stores/position'
import { allFormats, LV95Format } from '@/utils/coordinates/coordinateFormat'
import getHumanReadableCoordinate from '@/utils/mouseTrackerUtils'

const dispatcher: ActionDispatcher = { name: 'OpenLayersMouseTracker.vue' }

const mousePosition = useTemplateRef<HTMLElement>('mousePosition')
const displayedFormatId = ref(LV95Format.id)

const positionStore = usePositionStore()
const projection = computed(() => positionStore.projection)

const olMap = toValue(inject<Map>('olMap'))
checkOlMapInjection()

let mousePositionControl: MousePosition | undefined

function checkOlMapInjection() {
    if (!olMap) {
        log.error('OpenLayersMap is not available')
        throw new Error('OpenLayersMap is not available')
    }
}

function setMouseTracking() {
    mousePositionControl = new MousePosition({
        className: 'mouse-position-inner',
    })
    mousePositionControl.setTarget(mousePosition.value!)
    olMap!.addControl(mousePositionControl)
    // we wait for the next cycle to set the projection, otherwise the info can
    // sometimes be lost (and we end up with a different projection in the position display)
    void nextTick(() => {
        setDisplayedFormatWithId()
    })
}

function removeMouseTracking() {
    if (mousePositionControl) {
        olMap!.removeControl(mousePositionControl)
    }
}

onMounted(() => {
    checkOlMapInjection()
    setMouseTracking()
})

onBeforeUnmount(() => {
    removeMouseTracking()
})

function setDisplayedFormatWithId(): void {
    const displayedFormat = allFormats.find((format) => format.id === displayedFormatId.value)
    if (displayedFormat) {
        positionStore.setDisplayedFormat(displayedFormat, dispatcher)
    }
    if (displayedFormat && mousePositionControl) {
        mousePositionControl.setCoordinateFormat((coordinates) => {
            return getHumanReadableCoordinate({
                coordinates: coordinates as SingleCoordinate,
                displayedFormat,
                projection: projection.value,
            })
        })
    } else {
        log.error('Unknown coordinates display format', displayedFormatId.value)
    }
}
</script>

<template>
    <div class="fixed bottom-[8rem] left-[5rem] bg-[rgba(255,255,255,0.7)]">
        <select
            v-model="displayedFormatId"
            class="map-projection form-control-xs"
            data-cy="mouse-position-select"
            @change="setDisplayedFormatWithId"
        >
            <option
                v-for="format in allFormats"
                :key="format.id"
                :value="format.id"
            >
                {{ format.label }}
            </option>
        </select>
        <div
            ref="mousePosition"
            class="mouse-position"
            data-cy="mouse-position"
        />
    </div>
</template>

<style scoped>
.mouse-position {
    display: none;
    min-width: 10em;
    text-align: left;
    white-space: nowrap;
}
@media (any-hover: hover) {
    .mouse-position {
        display: block;
    }
}
</style>
