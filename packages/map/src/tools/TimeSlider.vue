<script setup lang="ts">
// import type { LayerTimeConfig } from '@swissgeo/layers'

import type { Dimension, Layer } from '@swissgeo/layers'

import { useLayerStore } from '@swissgeo/layers'
// import { timeConfigUtils } from '@swissgeo/layers/utils'
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { isNumber, round } from '@swissgeo/numbers'
import { LucideIcon } from '@swissgeo/skeleton'
// import { DEFAULT_YOUNGEST_YEAR } from '@swissgeo/staging-config/constants'
import GeoadminTooltip from '@swissgeo/tooltip'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
// import type { ActionDispatcher } from '@/store/types'
import { useI18n } from 'vue-i18n'

// import TimeSliderDropdown from '@/modules/map/components/toolbox/TimeSliderDropdown.vue'
// import useLayersStore from '@/store/modules/layers'
// import useUIStore from '@/store/modules/ui'
import debounce from '@/utils/debounce'

import { getYearsWithData } from './timeSliderUtils'
// const dispatcher: ActionDispatcher = { name: 'TimeSlider.vue' }

const { t } = useI18n()
// const uiStore = useUIStore()
const layerStore = useLayerStore()

const LABEL_WIDTH = 32
const MARGIN_BETWEEN_LABELS = 50
const PLAY_BUTTON_SIZE = 54

// to make it easier instead of having it all in one class string
const cursorStyle = ref([
    ...[
        'z-2',
        'cursor-grab',
        'solid',
        'border-bottom-0',
        'absolute',
        'top-[calc(0.75rem+29px)]',
        'border-b-0',
        'border-l-[9px]',
        'border-r-[9px]',
        'border-t-[9px]',
        'border-t-gray-300',
        'border-transparent',
    ],
    ...[
        'after:absolute',
        'after:left-[calc(50%-8px)]',
        'after:top-[calc(50%-9px)]',
        'after:border-b-0',
        'after:border-l-[8px]',
        'after:border-r-[8px]',
        'after:border-t-[8px]',
        'after:border-t-white',
        'after:border-transparent',
        'after:content-[" "]',
    ],
])

const sliderWidth = ref(0)
const currentYear = ref<number>()
const falseYear = ref<number | string | undefined>(undefined)
let cursorX = 0
const playYearsWithData = ref(false)
let yearCursorIsGrabbed = false
let playYearInterval: ReturnType<typeof setTimeout> | undefined

const yearCursor = useTemplateRef<HTMLDivElement>('yearCursor')
const sliderContainer = useTemplateRef<HTMLDivElement>('sliderContainer')
const yearCursorInput = useTemplateRef<HTMLInputElement>('yearCursorInput')
const outsideRangeTooltip = useTemplateRef<{ openTooltip: () => void; closeTooltip: () => void }>(
    'outsideRangeTooltip'
)

const screenWidth = computed(() => /*uiStore.width*/ 1024)

const layersWithTimestamps = computed((): LayerWithTime[] => {
    // type of ref isn't picked up correctly here...
    const layersWithTime: LayerWithTime[] = layerStore.layers.filter((layer: Layer) => {
        return layer.dimensions && 'time' in layer.dimensions
    })
    return layersWithTime
})

// const activeLayers = computed(() => /*layersStore.activeLayers*/ [])

// Youngest year available in the current layer data
// previously this was across all the available layers, but we can't do that anymore
// maybe it could also be possible to define that as a constant in the app
const youngestYear = computed(() =>
    Math.max(
        yearsWithData.value.yearsJoint[yearsWithData.value.yearsJoint.length - 1] ?? 0,
        yearsWithData.value.yearsSeparate[yearsWithData.value.yearsSeparate.length - 1] ?? 0
    )
)

// Olds year available in the current layer data
// previously this was across all the available layers, but we can't do that anymore
// maybe it could also be possible to define that as a constant in the app
const oldestYear = computed(() =>
    Math.min(
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

const isInputYearValid = ref(true)

const tooltipYearOutsideRangeContent = computed(
    () =>
        `${t('outside_valid_year_range')} ${allYears.value[0]}-${allYears.value[allYears.value.length - 1]}`
)

const inputYear = computed({
    get() {
        if (falseYear.value !== undefined) {
            return falseYear.value
        }
        return currentYear.value
    },
    set(value: string | number) {
        const parsedValue = parseInt(value.toString())
        if (!allYears.value.includes(parsedValue)) {
            isInputYearValid.value = false
            // || '' enables the value to be cleared
            falseYear.value = parsedValue || ''
        } else {
            isInputYearValid.value = true
            currentYear.value = parsedValue
            falseYear.value = undefined
        }
    },
})

const yearsShownAsLabel = computed(() => {
    const amountOfLabelsOnScreen = round(sliderWidth.value / (LABEL_WIDTH + MARGIN_BETWEEN_LABELS))

    let yearThreshold = 10
    if (amountOfLabelsOnScreen < 10) {
        yearThreshold = 50
    } else if (amountOfLabelsOnScreen <= 16) {
        yearThreshold = 25
    }
    return allYears.value.filter((year) => year % yearThreshold === 0)
})

const innerBarStyle = computed(() => ({ width: `${sliderWidth.value}px` }))

const yearPositionOnSlider = computed(
    () => (1 + allYears.value.indexOf(currentYear.value)) * distanceBetweenLabels.value + 42
)

const cursorPosition = computed(() => {
    const yearCursorWidth = yearCursor.value?.clientWidth || 0
    return `${Math.max(yearPositionOnSlider.value - yearCursorWidth / 2 + 4.5, 0)}px`
})

const cursorArrowPosition = computed(() => ({ left: `${yearPositionOnSlider.value - 4.5}px` }))
const distanceBetweenLabels = computed(() => sliderWidth.value / allYears.value.length)
const innerBarStepStyle = computed(() => ({ width: `${distanceBetweenLabels.value}px` }))

const yearsWithData = computed(() => getYearsWithData(layersWithTimestamps.value))

watch(screenWidth, () => {
    setSliderWidth()
})

watch(
    [oldestYear, youngestYear, yearsWithData, allYears, currentYear],
    () => {
        // console.log('oldest', oldestYear.value)
        // console.log('yougest', youngestYear.value)
        console.log('data', yearsWithData.value)
        console.log('allYears', allYears.value)
        console.log('currentYear', currentYear.value)
        console.log('previewYear', previewYear.value)
    },
    { immediate: true }
)

/** Initialize the current year to the youngest year if it's not set, e.g. when opening the slider */
watch(
    youngestYear,
    () => {
        if (!currentYear.value) {
            log.debug({
                title: 'TimeSlider.vue',
                titleColor: LogPreDefinedColor.Blue,
                messages: [
                    `Setting default currentYear to youngest year available: ${youngestYear.value}`,
                ],
            })
            currentYear.value = youngestYear.value
        }
    },
    { immediate: true }
)

watch(isInputYearValid, (newValue) => {
    if (!newValue) {
        outsideRangeTooltip.value?.openTooltip()
    } else {
        outsideRangeTooltip.value?.closeTooltip()
    }
})

watch(currentYear, () => {
    falseYear.value = undefined
    isInputYearValid.value = true
    dispatchPreviewYearToStoreDebounced()
})

// watch(layersWithTimestamps, () => {
//     dispatchPreviewYearToStoreDebounced()
// })

onMounted(() => {
    log.debug({
        title: 'TimeSlider.vue',
        titleColor: LogPreDefinedColor.Blue,
        messages: [`Activating time slider, previewYear=${previewYear.value}`],
    })
    setSliderWidth()

    // if (previewYear.value === undefined) {
    //     if (
    //         layersWithTimestamps.value.length === 1 &&
    //         'currentTimeEntry' in layersWithTimestamps.value[0]!.timeConfig &&
    //         allYears.value.includes(
    // layersWithTimestamps.value[0]!.timeConfig.currentTimeEntry?.year as number
    //         )
    //     ) {
    //         currentYear.value = layersWithTimestamps.value[0]!.timeConfig.currentTimeEntry
    //             ?.year as number
    //     } else if (yearsWithData.value.yearsJoint.length > 0) {
    //         currentYear.value = yearsWithData.value.yearsJoint[0]!
    //     } else if (yearsWithData.value.yearsSeparate[0]) {
    //         currentYear.value = yearsWithData.value.yearsSeparate[0]
    //     } else {
    //         return
    //     }

    //     dispatchPreviewYearToStore()
    // } else if (previewYear.value !== undefined) {
    //     currentYear.value = previewYear.value
    //     setPreviewYearToLayers()
    // }

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

function setSliderWidth() {
    const padding = 112
    if (!sliderContainer.value || !sliderContainer.value?.clientWidth) {
        log.error({
            title: 'TimeSlider.vue',
            titleColor: LogPreDefinedColor.Red,
            messages: ['sliderContainer clientWidth is undefined'],
        })
        return
    }
    sliderWidth.value = sliderContainer.value.clientWidth - padding - PLAY_BUTTON_SIZE || 0
}

function positionNodeLabel(year: number) {
    const timestampIndex = allYears.value.indexOf(year) ?? 1
    const leftPosition = Math.max(
        LABEL_WIDTH / 2.0,
        timestampIndex * distanceBetweenLabels.value -
            yearsShownAsLabel.value.indexOf(year) * LABEL_WIDTH
    )
    return {
        left: `${Math.min(leftPosition, sliderWidth.value - LABEL_WIDTH)}px`,
    }
}

function grabCursor(event: MouseEvent | TouchEvent) {
    yearCursorIsGrabbed = true
    if ('touches' in event) {
        cursorX = event.touches[0]!.screenX
    } else {
        cursorX = event.screenX
    }
    window.addEventListener('mousemove', listenToMouseMove, { passive: true })
    window.addEventListener('touchmove', listenToMouseMove, { passive: true })
    window.addEventListener('mouseup', releaseCursor, { passive: true })
    window.addEventListener('touchend', releaseCursor, { passive: true })
}

function listenToMouseMove(event: MouseEvent | TouchEvent) {
    const currentPosition = 'touches' in event ? event.touches[0]!.screenX : event.screenX
    const deltaX = cursorX - currentPosition
    if (Math.abs(deltaX) >= distanceBetweenLabels.value) {
        let futureYearIndex = allYears.value.indexOf(currentYear.value)

        const absoluteDeltaIndex = Math.floor(Math.abs(deltaX) / distanceBetweenLabels.value)
        if (deltaX < 0) {
            if (allYears.value.length > futureYearIndex + absoluteDeltaIndex) {
                futureYearIndex += absoluteDeltaIndex
            } else if (allYears.value.length > futureYearIndex + 1) {
                futureYearIndex++
            }
        } else if (deltaX > 0) {
            if (futureYearIndex > absoluteDeltaIndex) {
                futureYearIndex -= absoluteDeltaIndex
            } else if (futureYearIndex > 0) {
                futureYearIndex--
            }
        }
        const futureYear = allYears.value[futureYearIndex]
        cursorX = currentPosition
        currentYear.value = futureYear!
    }
}

function releaseCursor() {
    yearCursorIsGrabbed = false
    window.removeEventListener('mousemove', listenToMouseMove)
    window.removeEventListener('touchmove', listenToMouseMove)
    window.removeEventListener('mouseup', releaseCursor)
    window.removeEventListener('touchend', releaseCursor)
}

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

function stepClasses(year: number) {
    let classes: string[] = []

    const tickBase = [
        'before:bg-gray-600',
        'before:block',
        'before:content-[""]',
        'before:w-[1px]',
        'before:h-[2px]',
    ]

    if (year % 50 === 0) {
        // Big Tick
        classes = [...tickBase, 'before:w-[2px]', 'before:h-[15px]', 'before:-ml-[2px]']
    } else if (year % 25 === 0) {
        // medium tick
        classes = [...tickBase, 'before:h-[10px]', 'before:-ml-[1px]']
    } else if (year % 5 === 0) {
        // small tick
        classes = [...tickBase, 'before:-ml-[0.5px]']
    } else {
        classes = tickBase
    }

    if (yearsWithData.value.yearsJoint.includes(year)) {
        classes.push('bg-primary-300')
    } else if (yearsWithData.value.yearsSeparate.includes(year)) {
        classes.push('bg-primary-50')
    } else {
        classes.push('bg-gray-300')
    }

    return classes
}
</script>

<template>
    <div
        ref="sliderContainer"
        data-cy="time-slider"
        class="w-full"
        :class="{ grabbed: yearCursorIsGrabbed }"
    >
        <div
            class="flex w-full justify-between"
            data-test="time-slider-container"
        >
            <div
                class="hidden w-full bg-white px-5 lg:block"
                data-cy="time-slider-bar"
            >
                <div
                    ref="yearCursor"
                    data-cy=""
                    class="absolute top-2 flex h-[34px] gap-1 rounded border border-gray-200 py-1 select-none"
                    :style="{ left: cursorPosition }"
                >
                    <div
                        class="border-right flex items-center border-gray-200"
                        data-cy="time-slider-bar-cursor-grab"
                        @touchstart.passive="grabCursor"
                        @mousedown.passive="grabCursor"
                    >
                        <LucideIcon
                            name="GripVertical"
                            class="h-5"
                        />
                    </div>
                    <GeoadminTooltip
                        ref="outsideRangeTooltip"
                        theme="danger"
                        :tooltip-content="tooltipYearOutsideRangeContent"
                        open-trigger="manual"
                        use-default-padding
                    >
                        <input
                            v-model="inputYear"
                            class="w-11 px-0 py-0 text-center"
                            :class="{ 'is-invalid': !isInputYearValid }"
                            data-cy="time-slider-bar-cursor-year outline-none"
                            maxlength="4"
                            type="text"
                            onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                            @keypress.enter="yearCursorInput?.blur()"
                        />
                    </GeoadminTooltip>
                    <div
                        class="border-left flex items-center border-gray-200"
                        @touchstart.passive="grabCursor"
                        @mousedown.passive="grabCursor"
                    >
                        <LucideIcon
                            name="GripVertical"
                            class="h-5"
                        />
                    </div>
                </div>
                <div
                    data-cy="time-slider-bar-cursor-arrow"
                    :class="cursorStyle"
                    :style="cursorArrowPosition"
                />
                <GeoadminTooltip
                    placement="bottom"
                    theme="secondary"
                    use-default-padding
                >
                    <div
                        v-if="allYears"
                        ref="timeSliderBar"
                        class="mt-12 flex h-full bg-gray-300"
                        :style="innerBarStyle"
                    >
                        <span
                            v-for="year in allYears"
                            :key="year"
                            :style="innerBarStepStyle"
                            class="time-slider-bar-inner-step inline-block h-4"
                            :data-cy="`time-slider-bar-${year}`"
                            :class="stepClasses(year)"
                            @click="currentYear = year"
                        />
                    </div>
                    <template #content>
                        <!-- <div class="time-slider-infobox">
                            <div class="mb-2">
                                {{ t('time_slider_legend_tooltip_intro') }}
                            </div>
                            <div class="ps-3">
                                <div class="mb-1">
                                    <div class="color-tooltip-data-none me-2" />
                                    <div>{{ t('time_slider_legend_tooltip_no_data') }}</div>
                                </div>
                                <div class="mb-1">
                                    <div class="color-tooltip-data-partial me-2" />
                                    <div>{{ t('time_slider_legend_tooltip_partial_data') }}</div>
                                </div>
                                <div>
                                    <div class="color-tooltip-data-full me-2" />
                                    <div>{{ t('time_slider_legend_tooltip_full_data') }}</div>
                                </div>
                            </div>
                        </div> -->
                    </template>
                </GeoadminTooltip>
                <div
                    v-for="yearAsLabel in yearsShownAsLabel"
                    :key="yearAsLabel"
                    class="relative top-0 inline-flex -translate-x-1/2"
                    :style="positionNodeLabel(yearAsLabel)"
                >
                    <small>
                        {{ yearAsLabel }}
                    </small>
                </div>
            </div>

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
