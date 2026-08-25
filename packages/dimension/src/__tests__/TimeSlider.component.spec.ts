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
  return mount(TimeSlider, {
    global: {
      stubs: {
        UButton: defineComponent({
          inheritAttrs: false,
          emits: ["click"],
          template: '<button v-bind="$attrs" @click="$emit(\'click\')" />',
        }),
      },
    },
  });
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

  describe("togglePlayYearsWithData", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function setupLayersWithYears(
      layerUuid: string,
      availableValues: string[],
      currentValue: string,
    ) {
      const store = useDimensionsStore();
      store.setLayerDimensions(layerUuid, {
        time: { currentValue, availableValues },
      });
      return store;
    }

    it("starts playback from the first year when currentYear is not in yearsWithData", async () => {
      setupLayersWithYears("layer-a", ["2020", "2022", "2024"], "2025");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(0);

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-a")?.time?.currentValue).toBe("2020");

      wrapper.unmount();
    });

    it("starts playback from the first year when currentYear is the last year with data", async () => {
      setupLayersWithYears("layer-b", ["2020", "2022", "2024"], "2024");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(0);

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-b")?.time?.currentValue).toBe("2020");

      wrapper.unmount();
    });

    it("continues from the current year when it is in the middle of yearsWithData", async () => {
      setupLayersWithYears("layer-c", ["2020", "2022", "2024"], "2022");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(0);

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-c")?.time?.currentValue).toBe("2022");

      wrapper.unmount();
    });

    it("advances to the next year after 1 second", async () => {
      setupLayersWithYears("layer-d", ["2020", "2022", "2024"], "2020");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(1000);
      await nextTick();

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-d")?.time?.currentValue).toBe("2022");

      wrapper.unmount();
    });

    it("stops playback after reaching the last year", async () => {
      setupLayersWithYears("layer-e", ["2020", "2022", "2024"], "2022");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(1000);
      await nextTick();
      vi.advanceTimersByTime(1000);
      await nextTick();

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-e")?.time?.currentValue).toBe("2024");

      vi.advanceTimersByTime(1000);
      await nextTick();
      expect(store.getDimensions("layer-e")?.time?.currentValue).toBe("2024");

      wrapper.unmount();
    });

    it("stops playback when toggled off mid-playback", async () => {
      setupLayersWithYears("layer-f", ["2020", "2022", "2024"], "2020");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(500);
      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");

      const store = useDimensionsStore();
      const valueAtStop = store.getDimensions("layer-f")?.time?.currentValue;
      vi.advanceTimersByTime(2000);
      expect(store.getDimensions("layer-f")?.time?.currentValue).toBe(
        valueAtStop,
      );

      wrapper.unmount();
    });

    it("does not start playback when there are no years with data", async () => {
      setupLayersWithYears("layer-g", ["ALL_YEARS"], "ALL_YEARS");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(0);

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-g")?.time?.currentValue).toBe(
        "ALL_YEARS",
      );

      wrapper.unmount();
    });

    it("does not advance when toggled back off quickly", async () => {
      setupLayersWithYears("layer-i", ["2020", "2022", "2024"], "2020");
      const wrapper = mountTimeSlider();
      await nextTick();

      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(300);
      await wrapper
        .find("[data-test='time-slider-play-button']")
        .trigger("click");
      vi.advanceTimersByTime(2000);

      const store = useDimensionsStore();
      expect(store.getDimensions("layer-i")?.time?.currentValue).toBe("2020");

      wrapper.unmount();
    });
  });
});
