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

  it.each([
    ["YYYYMMDD", "20240101"],
    ["YYYY", "1981"],
    ["ISO", "2024-01-01T00:00:00Z"],
    ["'current'", "current"],
    ["null", null],
  ] as [string, string | null][])(
    "passes through a %s currentValue unchanged",
    (_label, value) => {
      setupLayerWithTimeValue(value);
      const { exportState } = useStateConfig();

      expect(
        exportState.value.state.layers?.[0]?.dimensions?.time?.currentValue,
      ).toBe(value);
    },
  );
});
