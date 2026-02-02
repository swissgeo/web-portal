<script setup lang="ts">
// import type { LayerTimeConfig } from '@swissgeo/layers'

import type { Dimension, Layer } from '@swissgeo/layers'

import { useLayerStore } from '@swissgeo/layers'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { LucideIcon } from '@swissgeo/skeleton'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// import TimeSliderDropdown from '@/modules/map/components/toolbox/TimeSliderDropdown.vue'
// import useUIStore from '@/store/modules/ui'
import debounce from '@/utils/debounce'

import TimeSliderBar from './TimeSliderBar.vue'
import { getYearsWithData } from './timeSliderUtils'
// const dispatcher: ActionDispatcher = { name: 'TimeSlider.vue' }

// const uiStore = useUIStore()
const layerStore = useLayerStore()
let cursorX = 0
let playYearInterval: ReturnType<typeof setTimeout> | undefined

const currentYear = ref<number>()
const playYearsWithData = ref(false)
const yearCursorIsGrabbed = ref(false)

const sliderContainer = useTemplateRef<HTMLDivElement>('sliderContainer')

const screenWidth = computed(() => /*uiStore.width*/ 1024)

const layersWithTimestamps = computed((): LayerWithTime[] => {
    // type of ref isn't picked up correctly here...
    const layersWithTime: LayerWithTime[] = layerStore.layers.filter((layer: Layer) => {
        return layer.dimensions && 'time' in layer.dimensions
    })
    return layersWithTime
})

// const activeLayers = computed(() => /*layersStore.activeLayers*/ [])

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

const previewYear = ref()

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

const containerWidth = computed(() => {
    if (!sliderContainer.value || !sliderContainer.value?.clientWidth) {
        log.error({
            title: 'TimeSlider.vue',
            titleColor: LogPreDefinedColor.Red,
            messages: ['sliderContainer clientWidth is not defined', sliderContainer.value],
        })
        return
    }
    return sliderContainer.value.clientWidth
})

watch(screenWidth, () => {})

// watch(
//     [oldestYear, youngestYear, yearsWithData, allYears, currentYear],
//     () => {
//         // console.log('oldest', oldestYear.value)
//         // console.log('yougest', youngestYear.value)
//         console.log('data', yearsWithData.value)
//         console.log('allYears', allYears.value)
//         console.log('currentYear', currentYear.value)
//         console.log('previewYear', previewYear.value)
//     },
//     { immediate: true }
// )

watch(currentYear, () => {
    dispatchPreviewYearToStoreDebounced()
})

watch(
    sliderContainer,
    () => {
        console.log('sliderContainer watch', sliderContainer.value)
    },
    { immediate: true }
)

// watch(layersWithTimestamps, () => {
//     dispatchPreviewYearToStoreDebounced()
// })

onMounted(() => {
    log.debug({
        title: 'TimeSlider.vue',
        titleColor: LogPreDefinedColor.Blue,
        messages: [`Activating time slider, previewYear=${previewYear.value}`],
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
})

function initializeCurrentYear() {
    if (layersWithTimestamps.value.length > 1) {
        // more than one layer. We initialize it to the youngest available year
        const availableYearsWithData = yearsWithData.value.yearsJoint
        if (availableYearsWithData.length > 0) {
            currentYear.value = availableYearsWithData[0]
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

            const parsedYear = getYearFromCustomGeoadminValue(timeConfig.currentValue)
            if (parsedYear) {
                currentYear.value = parseInt(parsedYear)
            }
        }
    }
}

// function setPreviewYearToLayers() {
//     activeLayers.value.forEach((layer, index) => {
//         const year = previewYear.value
//         if (
//             layer.isVisible &&
//             timeConfigUtils.hasMultipleTimestamps(layer) &&
//             layer.timeConfig &&
//             'currentTimeEntry' in layer.timeConfig &&
//             layer.timeConfig.currentTimeEntry !== year
//         ) {
//             // layersStore.setTimedLayerCurrentYear(index, year, dispatcher)
//         }
//     })
// }

function dispatchCurrentYearToStore() {
    if (!currentYear.value) {
        return
    }

    for (const layer of layersWithTimestamps.value) {
        const yearValue = convertYearToTimestamp(layer, currentYear.value)
        const dimension: Partial<Dimension> = {
            currentValue: yearValue,
        }
        layerStore.setDimension('time', layer.uuid, dimension)
    }
}

const dispatchPreviewYearToStoreDebounced = debounce(dispatchCurrentYearToStore, 100)

function togglePlayYearsWithData() {
    // playYearsWithData.value = !playYearsWithData.value
    // if (playYearsWithData.value) {
    //     const yearsWithDataForPlayer = allYears.value
    //         .filter(
    //             (year) =>
    //                 yearsWithData.value.yearsJoint.includes(year) ||
    //                 yearsWithData.value.yearsSeparate.includes(year)
    //         )
    //         .sort()
    //         .reverse()
    //     if (
    //         !yearsWithDataForPlayer.includes(currentYear.value) ||
    //         currentYear.value === yearsWithDataForPlayer[0]
    //     ) {
    //         currentYear.value = yearsWithDataForPlayer.slice(-1)[0]!
    //     }
    //     playYearInterval = setInterval(() => {
    //         const currentYearIndex = yearsWithDataForPlayer.indexOf(currentYear.value)
    //         if (currentYearIndex === 0) {
    //             clearInterval(playYearInterval)
    //             playYearInterval = undefined
    //             playYearsWithData.value = false
    //         } else {
    //             currentYear.value = yearsWithDataForPlayer[currentYearIndex - 1]!
    //         }
    //     }, 1000)
    // } else {
    //     clearInterval(playYearInterval)
    //     playYearInterval = undefined
    // }
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
        class="w-full"
        @grabbing="yearCursorIsGrabbed = $event"
        :class="{ grabbed: yearCursorIsGrabbed }"
    >
        <div
            class="flex w-full justify-between"
            data-test="time-slider-container"
        >
            <TimeSliderBar
                :allYears="allYears"
                :yearsWithData
                v-model="currentYear"
                :containerWidth="containerWidth || 0"
            />

            <!-- <div
                class="time-slider-dropdown"
                data-cy="time-slider-dropdown"
            >
                <!-- <TimeSliderDropdown
                    v-model.number="currentYear"
                    :entries="allYears"
                    :is-playing="playYearsWithData"
                    @play="togglePlayYearsWithData"
                />
            </div> -->

            <div class="time-slider-play-button">
                <button
                    id="timeSliderPlayButton"
                    data-test="time-slider-play-button"
                    class="btn btn-light btn-lg m-1 flex self-center border p-3"
                    @click="togglePlayYearsWithData"
                >
                    <LucideIcon :name="playYearsWithData ? 'Pause' : 'Play'" />
                </button>
            </div>
        </div>
        <!-- Time slider color tooltip content -->
    </div>
</template>

<style>
/* TDOO make scoped work */
.arrow {
    position: absolute;
    z-index: 2;

    top: calc(0.75rem + 29px);

    cursor: grab;

    border-width: 9px 9px 0 9px;
    border-style: solid;
    border-color: var(--color-gray-300) transparent;
}

.arrow:after {
    content: '';
    position: absolute;

    left: calc(50% - 8px);
    top: -9px;

    border-width: 8px 8px 0 8px;
    border-color: white transparent;
}
</style>
