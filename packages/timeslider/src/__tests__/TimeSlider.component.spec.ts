import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick } from "vue";

import { useDimensionsStore } from "@/stores/dimensions";
import TimeSlider from "@/TimeSlider.vue";

vi.mock("@swissgeo/log", () => ({
  default: {
    debug: vi.fn(),
  },
  LogPreDefinedColor: { Blue: "blue" },
}));

vi.mock("@swissgeo/skeleton", () => ({
  IconButton: defineComponent({
    name: "IconButton",
    props: ["iconName", "id"],
    emits: ["click"],
    template: '<button :id="id" @click="$emit(\'click\')"><slot /></button>',
  }),
}));

vi.mock("@vueuse/core", () => ({
  useDebounceFn: (fn: () => void) => fn,
  useResizeObserver: () => ({}),
}));

vi.mock("@/TimeSliderBar.vue", () => ({
  default: defineComponent({
    name: "TimeSliderBar",
    props: ["allYears", "yearsWithData", "modelValue", "containerWidth"],
    emits: ["update:modelValue", "grabbing"],
    template: '<div data-testid="time-slider-bar-stub" />',
  }),
}));

function mountTimeSlider() {
  return mount(TimeSlider);
}

describe("TimeSlider.vue - store integration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("dispatches the current year to the dimensions store", () => {
    it("writes the converted timestamp to the store via setDimension when year is in availableValues", async () => {
      const dimensionsStore = useDimensionsStore();
      dimensionsStore.setLayerDimensions("layer-with-data", {
        time: {
          currentValue: "2024",
          availableValues: ["2022", "2023", "2024"],
        },
      });

      const wrapper = mountTimeSlider();
      await nextTick();

      expect(
        dimensionsStore.getDimensions("layer-with-data")?.time?.currentValue,
      ).toBe("2024");
      wrapper.unmount();
    });

    it("emits update-visibility with isVisible=false when the current year is not in the layer's availableValues", async () => {
      const dimensionsStore = useDimensionsStore();
      dimensionsStore.setLayerDimensions("no-data-layer", {
        time: {
          currentValue: "2024",
          availableValues: ["1990", "1995"],
        },
      });

      const wrapper = mountTimeSlider();
      await nextTick();

      const emitted = wrapper.emitted("update-visibility");
      expect(emitted).toBeTruthy();
      const [payload] = emitted![0] as [{ uuid: string; isVisible: boolean }];
      expect(payload).toEqual({ uuid: "no-data-layer", isVisible: false });
      wrapper.unmount();
    });
  });

  describe("closes itself when no time-enabled layers remain", () => {
    it("emits close when the last time dimension is cleared after mount", async () => {
      const dimensionsStore = useDimensionsStore();
      dimensionsStore.setLayerDimensions("lonely-layer", {
        time: {
          currentValue: "2024",
          availableValues: ["2022", "2023", "2024"],
        },
      });

      const wrapper = mountTimeSlider();
      await nextTick();

      expect(wrapper.emitted("close")).toBeFalsy();

      dimensionsStore.clearLayerDimensions("lonely-layer");
      await nextTick();

      expect(wrapper.emitted("close")).toBeTruthy();
      wrapper.unmount();
    });
  });

  describe("initializeCurrentYear reads the existing time dimension value", () => {
    it("uses the stored currentValue year for a single time-enabled layer", async () => {
      const dimensionsStore = useDimensionsStore();
      dimensionsStore.setLayerDimensions("single-layer", {
        time: {
          currentValue: "2016-08-15T00:00:00Z",
          availableValues: ["2015", "2016", "2017"],
        },
      });

      const wrapper = mountTimeSlider();
      await nextTick();

      expect(
        dimensionsStore.getDimensions("single-layer")?.time?.currentValue,
      ).toBe("2016");
      wrapper.unmount();
    });
  });
});
