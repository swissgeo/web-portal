import { useMapViewStore } from "~/stores/mapView";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

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
});
