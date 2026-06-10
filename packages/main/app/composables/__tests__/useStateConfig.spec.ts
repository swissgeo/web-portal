import type { Layer as MapLayer } from "@swissgeo/map";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useLayerStore } from "@swissgeo/layers";
import { useStateConfig } from "~/composables/useStateConfig";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

const mockMapLayers: MapLayer[] = [];

mockNuxtImport("useMapViewStore", () => () => ({
  mapLayers: mockMapLayers,
  backgroundLayer: null,
  addLayerToTop: (layer: MapLayer) => mockMapLayers.push(layer),
}));

function makeMapLayer(uuid: string): MapLayer {
  return { uuid, format: "WMTS", layerId: uuid, opacity: 1, isVisible: true };
}

describe("useStateConfig > exportState time dimension", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
  });

  function setupLayerWithTimeValue(currentValue: string | null) {
    const layerStore = useLayerStore();
    const uuid = "test-layer";

    layerStore.addLayer({
      uuid,
      humanId: uuid,
      type: "dataset",
      isLoading: false,
      layerUrl: "https://example.com/layer",
      dimensions: {
        time: { availableValues: [], currentValue },
      },
    });
    mockMapLayers.push(makeMapLayer(uuid));
  }

  it("passes through a YYYYMMDD currentValue unchanged", () => {
    setupLayerWithTimeValue("20240101");
    const { exportState } = useStateConfig();

    expect(
      exportState.value.state.layers?.[0]?.dimensions?.time?.currentValue,
    ).toBe("20240101");
  });

  it("passes through a YYYY currentValue unchanged", () => {
    setupLayerWithTimeValue("1981");
    const { exportState } = useStateConfig();

    expect(
      exportState.value.state.layers?.[0]?.dimensions?.time?.currentValue,
    ).toBe("1981");
  });

  it("passes through an ISO currentValue unchanged", () => {
    setupLayerWithTimeValue("2024-01-01T00:00:00Z");
    const { exportState } = useStateConfig();

    expect(
      exportState.value.state.layers?.[0]?.dimensions?.time?.currentValue,
    ).toBe("2024-01-01T00:00:00Z");
  });

  it("passes through 'current'", () => {
    setupLayerWithTimeValue("current");
    const { exportState } = useStateConfig();

    expect(
      exportState.value.state.layers?.[0]?.dimensions?.time?.currentValue,
    ).toBe("current");
  });

  it("passes through null", () => {
    setupLayerWithTimeValue(null);
    const { exportState } = useStateConfig();

    expect(
      exportState.value.state.layers?.[0]?.dimensions?.time?.currentValue,
    ).toBeNull();
  });
});
