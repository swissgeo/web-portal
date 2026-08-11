<script lang="ts" setup>
import { useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import useTimeSliderBar from "./composables/useTimeSliderBar";
import TimeSliderBarSteps from "./TimeSliderBarSteps.vue";

const { allYears, modelValue, yearsWithData, containerWidth } = defineProps<{
  allYears: number[];
  modelValue?: number;
  yearsWithData: {
    yearsJoint: number[];
    yearsSeparate: number[];
  };
  containerWidth: number;
}>();

const emit = defineEmits(["update:modelValue", "grabbing"]);

const { t } = useI18n();

const yearCursor = useTemplateRef<HTMLDivElement>("yearCursor");
const yearCursorInput = useTemplateRef<HTMLInputElement>("yearCursorInput");

const {
  inputYear,
  isInputYearValid,
  tooltipYearOutsideRangeContent,
  cursorPosition,
  cursorArrowPosition,
  yearsShownAsLabel,
  sliderWidth,
  grabCursor,
  setCurrentYear,
  positionNodeLabel,
} = useTimeSliderBar({
  allYears: () => allYears,
  modelValue: () => modelValue,
  yearsWithData: () => yearsWithData,
  containerWidth: () => containerWidth,
  getCursorElement: () => yearCursor.value,
  onUpdateModelValue: (year) => emit("update:modelValue", year),
  onGrabbing: (isGrabbing) => emit("grabbing", isGrabbing),
});
</script>

<template>
  <div
    class="min-0 relative flex-1 overflow-visible bg-white pr-1 pl-12"
    data-testid="time-slider-bar"
  >
    <div
      ref="yearCursor"
      class="absolute top-2 flex h-[34px] gap-1 rounded border border-gray-200 py-1 select-none"
      :style="{ left: cursorPosition }"
    >
      <div
        class="border-right flex cursor-pointer items-center border-gray-200"
        data-testid="time-slider-bar-cursor-grab"
        @touchstart.passive="grabCursor"
        @mousedown.passive="grabCursor"
      >
        <UIcon name="i-lucide-grip-vertical" class="size-5" />
      </div>
      <UTooltip
        :open="!isInputYearValid"
        :text="tooltipYearOutsideRangeContent"
        arrow
      >
        <input
          v-model="inputYear"
          class="w-11 px-0 py-0 text-center outline-none"
          :class="{ 'is-invalid': !isInputYearValid }"
          data-testid="time-slider-bar-cursor-year"
          maxlength="4"
          type="text"
          @keydown="
            (e) => {
              if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }
          "
          @keypress.enter="yearCursorInput?.blur()"
        />
      </UTooltip>
      <div
        class="border-left flex items-center border-gray-200"
        @touchstart.passive="grabCursor"
        @mousedown.passive="grabCursor"
      >
        <UIcon name="i-lucide-grip-vertical" class="size-5" />
      </div>
    </div>
    <div
      data-testid="time-slider-bar-cursor-arrow"
      class="arrow"
      :style="cursorArrowPosition"
    />
    <UTooltip placement="bottom" :delay-duration="0" arrow>
      <TimeSliderBarSteps
        :allYears="allYears"
        :years-joint="yearsWithData.yearsJoint"
        :years-separate="yearsWithData.yearsSeparate"
        ref="timeSliderBar"
        @select="setCurrentYear($event)"
        :sliderWidth="sliderWidth"
      />
      <template #content>
        <p>
          {{ t("timeSlider.legendExplanation") }}
        </p>
      </template>
    </UTooltip>
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
  content: "";
  position: absolute;
  left: calc(50% - 8px);
  top: -9px;
  border-width: 8px 8px 0 8px;
  border-style: solid;
  border-color: white transparent;
}
</style>
