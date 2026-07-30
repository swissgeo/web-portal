import type { SingleCoordinate } from "@swissgeo/coordinates";
import type { Layer } from "@swissgeo/layers";

import { useDimensionsStore } from "@swissgeo/dimension";
import { useLayerStore } from "@swissgeo/layers";
import { useToolboxStore } from "~/stores/toolbox";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";

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
        position: undefined as SingleCoordinate | undefined,
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

describe("useToolboxStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    closeTimeSliderMock.mockClear();
  });

  describe("panel tracking", () => {
    it("starts with no active panel", () => {
      const store = useToolboxStore();
      expect(store.activeDetailPanel).toBeNull();
    });

    it("opens a panel", () => {
      const store = useToolboxStore();
      store.toggleDetailPanel("share");
      expect(store.activeDetailPanel).toBe("share");
    });

    it("closes the same panel (toggle off)", () => {
      const store = useToolboxStore();
      store.toggleDetailPanel("share");
      store.toggleDetailPanel("share");
      expect(store.activeDetailPanel).toBeNull();
    });

    it("switches to a different panel", () => {
      const store = useToolboxStore();
      store.toggleDetailPanel("share");
      store.toggleDetailPanel("import");
      expect(store.activeDetailPanel).toBe("import");
    });

    it("closeDetailPanel closes any open panel", () => {
      const store = useToolboxStore();
      store.toggleDetailPanel("share");
      store.closeDetailPanel();
      expect(store.activeDetailPanel).toBeNull();
    });

    it("isPanelActive returns true for the active panel", () => {
      const store = useToolboxStore();
      store.toggleDetailPanel("share");
      expect(store.isPanelActive("share")).toBe(true);
      expect(store.isPanelActive("import")).toBe(false);
    });

    it("isPanelActive returns false when no panel is active", () => {
      const store = useToolboxStore();
      expect(store.isPanelActive("share")).toBe(false);
    });
  });

  describe("showTimeSliderButton", () => {
    it("returns false when no layer has a time dimension", () => {
      const layerStore = useLayerStore();
      layerStore.addLayer(makeLayer("no-time"));

      const store = useToolboxStore();
      expect(store.showTimeSliderButton).toBe(false);
    });

    it("returns true when a layer has a time dimension", () => {
      const layerStore = useLayerStore();
      const dimensionsStore = useDimensionsStore();
      layerStore.addLayer(makeLayer("with-time"));
      dimensionsStore.setDimension("with-time", "time", {
        currentValue: "2024",
        availableValues: ["2024"],
      });

      const store = useToolboxStore();
      expect(store.showTimeSliderButton).toBe(true);
    });

    it("calls closeTimeSlider when the last time dimension is cleared", async () => {
      const layerStore = useLayerStore();
      const dimensionsStore = useDimensionsStore();
      layerStore.addLayer(makeLayer("with-time"));
      dimensionsStore.setDimension("with-time", "time", {
        currentValue: "2024",
        availableValues: ["2024"],
      });

      useToolboxStore();
      expect(closeTimeSliderMock).not.toHaveBeenCalled();

      dimensionsStore.clearLayerDimensions("with-time");
      await vi.waitFor(() => {
        expect(closeTimeSliderMock).toHaveBeenCalled();
      });
    });
  });

  describe("showRecenterButton", () => {
    it("returns false when geolocation is inactive", () => {
      const store = useToolboxStore();
      expect(store.showRecenterButton).toBe(false);
    });

    it("returns true when geolocation is active with position", () => {
      mockUseGeolocationStore.mockReturnValueOnce({
        active: true,
        position: [0, 0],
      });
      setActivePinia(createPinia());
      const store = useToolboxStore();
      expect(store.showRecenterButton).toBe(true);
    });
  });

  describe("showCompareSliderButton", () => {
    it("returns false when no visible layers", () => {
      const store = useToolboxStore();
      expect(store.showCompareSliderButton).toBe(false);
    });
  });

  describe("focusModeNone", () => {
    it("returns true when focusMode is 'none'", () => {
      const store = useToolboxStore();
      expect(store.focusModeNone).toBe(true);
    });

    it("returns false when focusMode is not 'none'", () => {
      mockUseDrawing.mockReturnValueOnce({ focusMode: ref("draw") });
      setActivePinia(createPinia());
      const store = useToolboxStore();
      expect(store.focusModeNone).toBe(false);
    });
  });

  describe("visibility flags", () => {
    it("has correct defaults", () => {
      const store = useToolboxStore();
      expect(store.showFullScreenButton).toBe(true);
      expect(store.showGeolocationButton).toBe(true);
      expect(store.showCompassButton).toBe(false);
      expect(store.showZoomButtons).toBe(true);
      expect(store.show3dButton).toBe(false);
      expect(store.showDrawButton).toBe(true);
      expect(store.showMeasureButton).toBe(true);
      expect(store.showImportButton).toBe(true);
      expect(store.showShareButton).toBe(true);
      expect(store.showPrintButton).toBe(true);
    });
  });
});
