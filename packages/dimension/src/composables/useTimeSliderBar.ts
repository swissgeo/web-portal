import { round } from "@swissgeo/numbers";
import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";

const PLAY_BUTTON_SIZE = 54;
const STEP_BAR_LEFT = 48;

const LABEL_WIDTH = 32;
const MARGIN_BETWEEN_LABELS = 50;

const GAP_SIZE = 16;
const PADDING = 52;

export interface UseTimeSliderBarOptions {
  allYears: () => number[];
  modelValue: () => number | undefined;
  yearsWithData: () => { yearsJoint: number[]; yearsSeparate: number[] };
  containerWidth: () => number;
  getCursorElement: () => HTMLDivElement | null;
  onUpdateModelValue: (year: number) => void;
  onGrabbing: (isGrabbing: boolean) => void;
}

export default function useTimeSliderBar(options: UseTimeSliderBarOptions) {
  const { t } = useI18n();

  let cursorX = 0;

  const falseYear = ref<number | string | undefined>(undefined);
  const isInputYearValid = ref(true);

  const tooltipYearOutsideRangeContent = computed(() => {
    const years = options.allYears();
    return `${t("timeSlider.outsideValidYearRange")} ${years[0]}-${years[years.length - 1]}`;
  });

  const currentYear = computed(() => options.modelValue());

  function setCurrentYear(year: number) {
    options.onUpdateModelValue(year);
    isInputYearValid.value = true;
  }

  const inputYear = computed({
    get() {
      if (falseYear.value !== undefined) {
        return falseYear.value;
      }
      return currentYear.value;
    },
    set(value: string | number) {
      const parsedValue = parseInt(value.toString());
      if (!options.allYears().includes(parsedValue)) {
        isInputYearValid.value = false;
        falseYear.value = parsedValue || "";
      } else {
        isInputYearValid.value = true;
        setCurrentYear(parsedValue);
        falseYear.value = undefined;
      }
    },
  });

  const sliderWidth = computed(
    () => options.containerWidth() - PADDING - PLAY_BUTTON_SIZE - GAP_SIZE,
  );

  const distanceBetweenLabels = computed(
    () => sliderWidth.value / options.allYears().length,
  );

  const yearPositionOnSlider = computed(() => {
    const year = currentYear.value;
    if (!year) {
      return STEP_BAR_LEFT;
    }
    return (
      STEP_BAR_LEFT +
      options.allYears().indexOf(year) * distanceBetweenLabels.value -
      4.5
    );
  });

  const cursorArrowPosition = computed(() => ({
    left: `${yearPositionOnSlider.value - 4.5}px`,
  }));

  const cursorPosition = computed(() => {
    const yearCursorWidth = options.getCursorElement()?.clientWidth || 0;
    return `${Math.max(yearPositionOnSlider.value - yearCursorWidth / 2 + 4.5, 0)}px`;
  });

  const yearsShownAsLabel = computed(() => {
    const years = options.allYears();
    const amountOfLabelsOnScreen = round(
      sliderWidth.value / (LABEL_WIDTH + MARGIN_BETWEEN_LABELS),
    );

    let yearThreshold = 10;
    if (amountOfLabelsOnScreen < 5) {
      yearThreshold = 50;
    } else if (amountOfLabelsOnScreen < 8) {
      yearThreshold = 25;
    }
    return years.filter((year) => year % yearThreshold === 0);
  });

  function positionNodeLabel(year: number) {
    const years = options.allYears();
    const timestampIndex = years.indexOf(year);
    const tickPosition = timestampIndex * distanceBetweenLabels.value;
    const leftPosition = Math.max(
      LABEL_WIDTH / 2,
      Math.min(tickPosition, sliderWidth.value - LABEL_WIDTH / 2),
    );
    return {
      left: `${leftPosition}px`,
    };
  }

  function listenToMouseMove(event: MouseEvent | TouchEvent) {
    const currentPosition =
      "touches" in event ? event.touches[0].screenX : event.screenX;
    const deltaX = cursorX - currentPosition;
    const years = options.allYears();
    if (Math.abs(deltaX) >= distanceBetweenLabels.value && currentYear.value) {
      let futureYearIndex = years.indexOf(currentYear.value);

      const absoluteDeltaIndex = Math.floor(
        Math.abs(deltaX) / distanceBetweenLabels.value,
      );
      if (deltaX < 0) {
        if (years.length > futureYearIndex + absoluteDeltaIndex) {
          futureYearIndex += absoluteDeltaIndex;
        } else if (years.length > futureYearIndex + 1) {
          futureYearIndex++;
        }
      } else if (deltaX > 0) {
        if (futureYearIndex > absoluteDeltaIndex) {
          futureYearIndex -= absoluteDeltaIndex;
        } else if (futureYearIndex > 0) {
          futureYearIndex--;
        }
      }
      const futureYear = years[futureYearIndex];
      cursorX = currentPosition;
      setCurrentYear(futureYear!);
    }
  }

  function releaseCursor() {
    options.onGrabbing(false);
    window.removeEventListener("mousemove", listenToMouseMove);
    window.removeEventListener("touchmove", listenToMouseMove);
    window.removeEventListener("mouseup", releaseCursor);
    window.removeEventListener("touchend", releaseCursor);
  }

  function grabCursor(event: MouseEvent | TouchEvent) {
    options.onGrabbing(true);
    if ("touches" in event) {
      cursorX = event.touches[0].screenX;
    } else {
      cursorX = event.screenX;
    }
    window.addEventListener("mousemove", listenToMouseMove, { passive: true });
    window.addEventListener("touchmove", listenToMouseMove, { passive: true });
    window.addEventListener("mouseup", releaseCursor, { passive: true });
    window.addEventListener("touchend", releaseCursor, { passive: true });
  }

  onBeforeUnmount(() => {
    releaseCursor();
  });

  return {
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
  };
}
