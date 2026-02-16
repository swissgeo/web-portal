<script setup lang="ts">
import type { Dimension, Layer } from '@swissgeo/layers'

import { useLayerStore } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { IconButton } from '@swissgeo/skeleton'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

import type { LayerWithTime } from './timeSliderUtils'

import TimeSliderBar from './TimeSliderBar.vue'
import {
    convertYearToTimestamp,
    getYearFromGeoadminWMTSValue,
    getYearsWithData,
} from './timeSliderUtils'

const layerStore = useLayerStore()
let playYearInterval: ReturnType<typeof setInterval> | undefined

const currentYear = ref<number>()
const playYearsWithData = ref(false)
const yearCursorIsGrabbed = ref(false)

const sliderContainer = useTemplateRef<HTMLDivElement>('sliderContainer')
const containerWidth = ref(0)

useResizeObserver(sliderContainer, (entries) => {
    containerWidth.value = entries[0]?.contentRect.width ?? 0
})

const layersWithTimestamps = computed((): LayerWithTime[] => {
    // type of ref isn't picked up correctly here...
    const layersWithTime: LayerWithTime[] = layerStore.layers.filter((layer: Layer) => {
        return layer.dimensions && 'time' in layer.dimensions
    })
    return layersWithTime
})

const youngestYear = computed(() =>
    // Youngest year available in the current layer data
    // previously this was across all the available layers, but we can't do that anymore
    // let's hardcode this for now to the current year
    new Date().getFullYear()
)

const oldestYear = computed(
    // Oldest year available in the current layer data
    // previously this was across all the available layers, but we can't do that anymore
    // maybe let's hardcode this then for now to the start of swiss mapping time or older if
    // one layer has more
    () =>
        Math.min(
            1848,
            yearsWithData.value.yearsJoint[0] ?? 9999,
            yearsWithData.value.yearsSeparate[0] ?? 9999
        )
)

const allYears = computed(() => {
    const years: number[] = []
    if (oldestYear.value === undefined || youngestYear.value === undefined) {
        return years
    }
    for (let year = oldestYear.value; year <= youngestYear.value; year++) {
        years.push(year)
    }
    return years
})

const yearsWithData = computed(() => getYearsWithData(layersWithTimestamps.value))

watch(currentYear, () => {
    void dispatchPreviewYearToStoreDebounced()
})

onMounted(() => {
    log.debug({
        title: 'TimeSlider.vue',
        titleColor: LogPreDefinedColor.Blue,
        messages: ['Activating time slider'],
    })
    initializeCurrentYear()

    log.debug({
        title: 'TimeSlider.vue',
        titleColor: LogPreDefinedColor.Blue,
        messages: [`Time slider activated, currentYear=${currentYear.value}`],
    })
    window.addEventListener('keydown', handleKeyDownEvent)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDownEvent)
    clearInterval(playYearInterval)
})

function initializeCurrentYear() {
    if (layersWithTimestamps.value.length > 1) {
        // more than one layer. We initialize it to the youngest available year (last in sorted array)
        const availableYearsWithData = yearsWithData.value.yearsJoint
        if (availableYearsWithData.length > 0) {
            currentYear.value = availableYearsWithData[availableYearsWithData.length - 1]
        } else {
            // no available years with data? What are we even doing here?
            currentYear.value = youngestYear.value
        }
    } else {
        // only one layer. We set the time slider to it's current value
        const onlyLayer = layersWithTimestamps.value[0]
        const timeConfig = onlyLayer?.dimensions.time

        if (timeConfig?.currentValue) {
            log.debug({
                title: 'TimeSlider.vue',
                messages: [
                    'Setting initial current year to only time enabled layer value',
                    timeConfig.currentValue,
                ],
            })

            const parsedYear = getYearFromGeoadminWMTSValue(timeConfig.currentValue)
            if (parsedYear) {
                currentYear.value = parseInt(parsedYear)
            }
        }
    }
}

function dispatchCurrentYearToStore() {
    if (!currentYear.value) {
        return
    }

    for (const layer of layersWithTimestamps.value) {
        const yearValue = convertYearToTimestamp(layer, currentYear.value)

        if (yearValue === null) {
            // Layer doesn't have data for this year - hide it
            const storeLayer = layerStore.layers.find((l) => l.uuid === layer.uuid)
            if (storeLayer) {
                storeLayer.isVisible = false
            }
        } else {
            // Layer has data for this year - show it and set the time dimension
            const storeLayer = layerStore.layers.find((l) => l.uuid === layer.uuid)
            if (storeLayer) {
                storeLayer.isVisible = true
            }
            const dimension: Partial<Dimension> = {
                currentValue: yearValue,
            }
            layerStore.setDimension('time', layer.uuid, dimension)
        }
    }
}

const dispatchPreviewYearToStoreDebounced = useDebounceFn(dispatchCurrentYearToStore, 100)

function togglePlayYearsWithData() {
    playYearsWithData.value = !playYearsWithData.value
    if (playYearsWithData.value) {
        const yearsWithDataForPlayer = allYears.value
            .filter(
                (year) =>
                    yearsWithData.value.yearsJoint.includes(year) ||
                    yearsWithData.value.yearsSeparate.includes(year)
            )
            .sort((a, b) => a - b)

        // Guard: if no years with data, can't play
        if (yearsWithDataForPlayer.length === 0 || currentYear.value === undefined) {
            playYearsWithData.value = false
            return
        }

        if (
            !yearsWithDataForPlayer.includes(currentYear.value) ||
            currentYear.value === yearsWithDataForPlayer[yearsWithDataForPlayer.length - 1]
        ) {
            currentYear.value = yearsWithDataForPlayer[0]
        }
        playYearInterval = setInterval(() => {
            if (currentYear.value === undefined) {
                clearInterval(playYearInterval)
                playYearInterval = undefined
                playYearsWithData.value = false
                return
            }
            const currentYearIndex = yearsWithDataForPlayer.indexOf(currentYear.value)
            if (currentYearIndex === yearsWithDataForPlayer.length - 1) {
                clearInterval(playYearInterval)
                playYearInterval = undefined
                playYearsWithData.value = false
            } else {
                currentYear.value = yearsWithDataForPlayer[currentYearIndex + 1]
            }
        }, 1000)
    } else {
        clearInterval(playYearInterval)
        playYearInterval = undefined
    }
}

function handleKeyDownEvent(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (['mainBody', 'timeSliderButton', 'timeSliderPlayButton'].includes(target.id)) {
        if (event.key === 'ArrowLeft') {
            const value = currentYear.value! - 1
            if (allYears.value.includes(value)) {
                currentYear.value = value
            }
        } else if (event.key === 'ArrowRight') {
            const value = currentYear.value! + 1
            if (allYears.value.includes(value)) {
                currentYear.value = value
            }
        }
    }
}
</script>

<template>
    <div
        ref="sliderContainer"
        data-cy="time-slider"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
        :class="{ grabbed: yearCursorIsGrabbed }"
    >
        <div
            class="flex items-center gap-1"
            data-test="time-slider-container"
        >
            <TimeSliderBar
                :allYears="allYears"
                :yearsWithData
                v-model="currentYear"
                :containerWidth="containerWidth"
                @grabbing="yearCursorIsGrabbed = $event"
            />

            <IconButton
                id="timeSliderPlayButton"
                data-test="time-slider-play-button"
                class="flex-shrink-0"
                severity="primary"
                :icon="playYearsWithData ? 'Pause' : 'Play'"
                @click="togglePlayYearsWithData"
            />
        </div>
    </div>
</template>

<style scoped></style>
