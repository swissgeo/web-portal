import type { Layer } from "@swissgeo/layers";

import { useDimensionsStore } from "@swissgeo/dimension";
import { useLayerStore } from "@swissgeo/layers";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";

import Toolbox from "@/components/toolbox/Toolbox.vue";

const closeTimeSliderMock = vi.fn();

const { mockUseDrawing, mockUseMapViewStore, mockUseGeolocationStore } =
  vi.hoisted(() => {
    return {
      mockUseDrawing: vi.fn(() => ({ focusMode: ref("none") })),
      mockUseMapViewStore: vi.fn(() => ({
        closeTimeSlider: vi.fn(),
        visibleLayers: computed(() => []),
      })),
      mockUseGeolocationStore: vi.fn(() => ({
        active: false,
        position: undefined,
      })),
    };
  });

vi.mock("@swissgeo/drawing", () => ({
  useDrawing: mockUseDrawing,
}));

vi.mock("@/stores/geolocation", () => ({
  useGeolocationStore: mockUseGeolocationStore,
}));

vi.mock("~/stores/mapView", () => ({
  useMapViewStore: mockUseMapViewStore,
}));

mockUseMapViewStore.mockImplementation(() => ({
  closeTimeSlider: closeTimeSliderMock,
  visibleLayers: computed(() => []),
}));

// `useMapViewStore` is auto-imported by Nuxt; stub via mockNuxtImport.
const { mockNuxtImport } = await import("@nuxt/test-utils/runtime");
mockNuxtImport("useMapViewStore", () => mockUseMapViewStore);

function makeLayer(uuid: string): Layer {
  return {
    uuid,
    humanId: `layer-${uuid}`,
    type: "dataset",
    isLoading: false,
    layerUrl: `https://example.com/${uuid}`,
  };
}

function mountToolbox() {
  return mount(Toolbox, {
    shallow: true,
    global: {
      stubs: {
        UCard: {
          template: "<div><slot /></div>",
        },
      },
    },
  });
}

describe("Toolbox.vue - showTimeSliderButton reads from dimensionsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    closeTimeSliderMock.mockClear();
  });

  it("hides the time slider button when no layer has a time dimension", async () => {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    layerStore.addLayer(makeLayer("no-time"));

    const wrapper = mountToolbox();
    await wrapper.vm.$nextTick();

    expect(dimensionsStore.getLayersWithDimension("time")).toEqual([]);
    expect(wrapper.findComponent({ name: "TimeSliderButton" }).exists()).toBe(
      false,
    );
  });

  it("shows the time slider button when a layer has a time dimension", async () => {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    layerStore.addLayer(makeLayer("with-time"));
    dimensionsStore.setDimension("with-time", "time", {
      currentValue: "2024",
      availableValues: ["2023", "2024"],
    });

    const wrapper = mountToolbox();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: "TimeSliderButton" }).exists()).toBe(
      true,
    );
  });

  it("calls closeTimeSlider on mapViewStore when the last time dimension is cleared", async () => {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    layerStore.addLayer(makeLayer("with-time"));
    dimensionsStore.setDimension("with-time", "time", {
      currentValue: "2024",
      availableValues: ["2023", "2024"],
    });

    const wrapper = mountToolbox();
    await wrapper.vm.$nextTick();

    expect(closeTimeSliderMock).not.toHaveBeenCalled();

    dimensionsStore.clearLayerDimensions("with-time");
    await wrapper.vm.$nextTick();

    expect(closeTimeSliderMock).toHaveBeenCalled();
  });
});
