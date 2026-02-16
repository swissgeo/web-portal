<script lang="ts" setup>
import { round } from '@swissgeo/numbers'
import { LucideIcon } from '@swissgeo/skeleton'
import GeoadminTooltip from '@swissgeo/tooltip'

import TimeSliderBarSteps from './TimeSliderBarSteps.vue'
const PLAY_BUTTON_SIZE = 54
const STEP_BAR_LEFT = 48 // matches pl-12 on root element

const LABEL_WIDTH = 32
const MARGIN_BETWEEN_LABELS = 50

let cursorX = 0

const { t } = useI18n()

const { allYears, modelValue, yearsWithData, containerWidth } = defineProps<{
    allYears: number[]
    modelValue: number
    yearsWithData: {
        yearsJoint: number[]
        yearsSeparate: number[]
    }
    containerWidth: number
}>()

const emit = defineEmits(['update:modelValue', 'grabbing'])

const falseYear = ref<number | string | undefined>(undefined)
const isInputYearValid = ref(true)

const yearCursor = useTemplateRef<HTMLDivElement>('yearCursor')
const yearCursorInput = useTemplateRef<HTMLInputElement>('yearCursorInput')

const tooltipYearOutsideRangeContent = computed(
    () => `${t('outside_valid_year_range')} ${allYears[0]}-${allYears[allYears.length - 1]}`
)

const currentYear = computed({
    get() {
        return modelValue
    },
    set(newValue: number) {
        emit('update:modelValue', newValue)
        isInputYearValid.value = true
    },
})

const inputYear = computed({
    get() {
        if (falseYear.value !== undefined) {
            return falseYear.value
        }
        return currentYear.value
    },
    set(value: string | number) {
        const parsedValue = parseInt(value.toString())
        if (!allYears.includes(parsedValue)) {
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

const cursorArrowPosition = computed(() => ({ left: `${yearPositionOnSlider.value - 4.5}px` }))
const distanceBetweenLabels = computed(() => sliderWidth.value / allYears.length)

const outsideRangeTooltip = useTemplateRef<{ openTooltip: () => void; closeTooltip: () => void }>(
    'outsideRangeTooltip'
)

const yearsShownAsLabel = computed(() => {
    const amountOfLabelsOnScreen = round(sliderWidth.value / (LABEL_WIDTH + MARGIN_BETWEEN_LABELS))

    let yearThreshold = 10
    if (amountOfLabelsOnScreen < 5) {
        yearThreshold = 50
    } else if (amountOfLabelsOnScreen < 8) {
        yearThreshold = 25
    }
    return allYears.filter((year) => year % yearThreshold === 0)
})

// yearPositionOnSlider is 4.5px left of the tick; both cursorArrowPosition
// and cursorPosition add 4.5 back to derive the final position aligned with the tick.
const yearPositionOnSlider = computed(
    () => STEP_BAR_LEFT + allYears.indexOf(currentYear.value) * distanceBetweenLabels.value - 4.5
)

const cursorPosition = computed(() => {
    const yearCursorWidth = yearCursor.value?.clientWidth || 0
    return `${Math.max(yearPositionOnSlider.value - yearCursorWidth / 2 + 4.5, 0)}px`
})

watch(isInputYearValid, (newValue) => {
    if (!newValue) {
        outsideRangeTooltip.value?.openTooltip()
    } else {
        outsideRangeTooltip.value?.closeTooltip()
    }
})

function grabCursor(event: MouseEvent | TouchEvent) {
    emit('grabbing', true)
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
        let futureYearIndex = allYears.indexOf(currentYear.value)

        const absoluteDeltaIndex = Math.floor(Math.abs(deltaX) / distanceBetweenLabels.value)
        if (deltaX < 0) {
            if (allYears.length > futureYearIndex + absoluteDeltaIndex) {
                futureYearIndex += absoluteDeltaIndex
            } else if (allYears.length > futureYearIndex + 1) {
                futureYearIndex++
            }
        } else if (deltaX > 0) {
            if (futureYearIndex > absoluteDeltaIndex) {
                futureYearIndex -= absoluteDeltaIndex
            } else if (futureYearIndex > 0) {
                futureYearIndex--
            }
        }
        const futureYear = allYears[futureYearIndex]
        cursorX = currentPosition
        currentYear.value = futureYear!
    }
}

function releaseCursor() {
    emit('grabbing', false)
    window.removeEventListener('mousemove', listenToMouseMove)
    window.removeEventListener('touchmove', listenToMouseMove)
    window.removeEventListener('mouseup', releaseCursor)
    window.removeEventListener('touchend', releaseCursor)
}

function positionNodeLabel(year: number) {
    const timestampIndex = allYears.indexOf(year)
    const tickPosition = timestampIndex * distanceBetweenLabels.value
    const leftPosition = Math.max(
        LABEL_WIDTH / 2,
        Math.min(tickPosition, sliderWidth.value - LABEL_WIDTH / 2)
    )
    return {
        left: `${leftPosition}px`,
    }
}

const GAP_SIZE = 20 // gap-5 = 20px
const padding = 60 // pl-14 (56px) + pr-1 (4px)
const sliderWidth = computed(() => containerWidth - padding - PLAY_BUTTON_SIZE - GAP_SIZE)
</script>

<template>
    <div
        class="min-0 relative flex-1 overflow-visible bg-white pr-1 pl-12"
        data-cy="time-slider-bar"
    >
        <div
            ref="yearCursor"
            data-cy=""
            class="absolute top-2 flex h-[34px] gap-1 rounded border border-gray-200 py-1 select-none"
            :style="{ left: cursorPosition }"
        >
            <div
                class="border-right flex cursor-pointer items-center border-gray-200"
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
                    class="w-11 px-0 py-0 text-center outline-none"
                    :class="{ 'is-invalid': !isInputYearValid }"
                    data-cy="time-slider-bar-cursor-year"
                    maxlength="4"
                    type="text"
                    @keydown="
                        (e) => {
                            if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
                                e.preventDefault()
                            }
                        }
                    "
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
            class="arrow"
            :style="cursorArrowPosition"
        />
        <GeoadminTooltip
            placement="bottom"
            theme="secondary"
            use-default-padding
        >
            <TimeSliderBarSteps
                :allYears="allYears"
                :years-joint="yearsWithData.yearsJoint"
                :years-separate="yearsWithData.yearsSeparate"
                ref="timeSliderBar"
                @select="currentYear = $event"
                :sliderWidth="sliderWidth"
            />
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
        <div class="relative h-5">
            <div
                v-for="yearAsLabel in yearsShownAsLabel"
                :key="yearAsLabel"
                class="absolute -translate-x-1/2"
                :style="positionNodeLabel(yearAsLabel)"
            >
                <small>
                    {{ yearAsLabel }}
                </small>
            </div>
        </div>
    </div>
</template>

<style scoped>
.is-invalid {
    border-color: rgb(239 68 68); /* red-500 */
    outline: none;
}

.is-invalid:focus {
    border-color: rgb(239 68 68); /* red-500 */
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.arrow {
    position: absolute;
    z-index: 10;
    top: calc(0.75rem + 29px);
    cursor: grab;
    border-width: 9px 9px 0 9px;
    border-style: solid;
    border-color: rgb(59 130 246) transparent; /* primary blue */
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.arrow:after {
    content: '';
    position: absolute;
    left: calc(50% - 8px);
    top: -9px;
    border-width: 8px 8px 0 8px;
    border-style: solid;
    border-color: white transparent;
}
</style>
