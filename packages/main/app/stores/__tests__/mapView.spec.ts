import type { Layer as MapLayer } from "@swissgeo/map";

import { useLayerStore } from "@swissgeo/layers";
import { useMapViewStore } from "~/stores/mapView";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

function makeLayer(uuid: string): MapLayer {
  return {
    format: "WMTS",
    layerId: uuid,
    uuid,
    opacity: 1,
    isVisible: true,
  };
}

/** Layer uuids from bottom to top, as they are kept in the store */
function stack(mapLayers: MapLayer[]) {
  return mapLayers.map((layer) => layer.uuid);
}

describe("mapView store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("toggles fullscreen mode", () => {
    const mapViewStore = useMapViewStore();

    expect(mapViewStore.isFullscreenModeActive).toBe(false);

    mapViewStore.toggleFullscreenMode();
    expect(mapViewStore.isFullscreenModeActive).toBe(true);

    mapViewStore.toggleFullscreenMode();
    expect(mapViewStore.isFullscreenModeActive).toBe(false);
  });

  it("enters and exits fullscreen mode explicitly", () => {
    const mapViewStore = useMapViewStore();

    mapViewStore.enterFullscreenMode();
    expect(mapViewStore.isFullscreenModeActive).toBe(true);

    mapViewStore.exitFullscreenMode();
    expect(mapViewStore.isFullscreenModeActive).toBe(false);
  });

  it("keeps existing time slider behavior", () => {
    const mapViewStore = useMapViewStore();

    expect(mapViewStore.isTimeSliderVisible).toBe(false);

    mapViewStore.toggleTimeSlider();
    expect(mapViewStore.isTimeSliderVisible).toBe(true);

    mapViewStore.closeTimeSlider();
    expect(mapViewStore.isTimeSliderVisible).toBe(false);
  });

  it("toggles and sets the compare slider active state", () => {
    const mapViewStore = useMapViewStore();

    expect(mapViewStore.isCompareSliderActive).toBe(false);

    mapViewStore.toggleCompareSlider();
    expect(mapViewStore.isCompareSliderActive).toBe(true);

    mapViewStore.toggleCompareSlider();
    expect(mapViewStore.isCompareSliderActive).toBe(false);

    mapViewStore.setCompareSliderActive(true);
    expect(mapViewStore.isCompareSliderActive).toBe(true);
  });

  it("clamps the compare ratio into [0, 1] and ignores non-finite input", () => {
    const mapViewStore = useMapViewStore();

    expect(mapViewStore.compareRatio).toBe(0.5);

    mapViewStore.setCompareRatio(0.25);
    expect(mapViewStore.compareRatio).toBe(0.25);

    // out-of-range values are clamped, not dropped
    mapViewStore.setCompareRatio(-1);
    expect(mapViewStore.compareRatio).toBe(0);

    mapViewStore.setCompareRatio(1.5);
    expect(mapViewStore.compareRatio).toBe(1);

    // non-finite input is ignored, keeping the previous ratio
    mapViewStore.setCompareRatio(Number.NaN);
    expect(mapViewStore.compareRatio).toBe(1);
  });

  describe("layer ordering", () => {
    it("moves the bottom-most layer, which used to be mistaken for a missing one", () => {
      const mapViewStore = useMapViewStore();
      mapViewStore.mapLayers = [makeLayer("a"), makeLayer("b")];

      mapViewStore.moveLayerUp(0);

      expect(stack(mapViewStore.mapLayers)).toEqual(["b", "a"]);
    });

    it("moves a layer to an arbitrary position", () => {
      const mapViewStore = useMapViewStore();
      mapViewStore.mapLayers = [makeLayer("a"), makeLayer("b"), makeLayer("c")];

      mapViewStore.setLayerIndex("a", 2);
      expect(stack(mapViewStore.mapLayers)).toEqual(["b", "c", "a"]);

      mapViewStore.setLayerIndex("a", 0);
      expect(stack(mapViewStore.mapLayers)).toEqual(["a", "b", "c"]);
    });

    it("keeps a layer within the stack", () => {
      const mapViewStore = useMapViewStore();
      mapViewStore.mapLayers = [makeLayer("a"), makeLayer("b")];

      mapViewStore.moveLayerUp(1);
      mapViewStore.moveLayerDown(0);

      expect(stack(mapViewStore.mapLayers)).toEqual(["a", "b"]);
    });

    it("keeps the layers above the background layer", () => {
      const layerStore = useLayerStore();
      const mapViewStore = useMapViewStore();
      layerStore.backgroundLayer = { uuid: "bg" } as never;
      mapViewStore.mapLayers = [
        makeLayer("bg"),
        makeLayer("a"),
        makeLayer("b"),
      ];

      // the layer sitting right above the background cannot sink below it
      mapViewStore.moveLayerDown(1);
      expect(stack(mapViewStore.mapLayers)).toEqual(["bg", "a", "b"]);

      // and neither can a drag drop it there
      mapViewStore.setLayerIndex("b", 0);
      expect(stack(mapViewStore.mapLayers)).toEqual(["bg", "a", "b"]);

      mapViewStore.setLayerIndex("b", 1);
      expect(stack(mapViewStore.mapLayers)).toEqual(["bg", "b", "a"]);
    });
  });
});
