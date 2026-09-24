import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, ref, toRaw } from "vue";

import type { WMSLayer } from "@/types/layers";

import useOlWmsLayer from "@/composables/olWMSLayer.composable";
import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";

vi.mock("@/composables/useAddLayerToMap.composable", () => ({
  default: vi.fn(() => ({ addLayerToMap: vi.fn() })),
}));

vi.mock("@/stores/position", () => ({
  default: () => ({
    projection: { epsg: "EPSG:3857", usesMercatorPyramid: true },
  }),
}));

vi.mock("@swissgeo/dimension", () => ({ ALL_YEARS_TIMESTAMP: "9999" }));

describe.each([
  { mode: "TileWMS", gutter: 0 },
  { mode: "ImageWMS", gutter: -1 },
])("$mode identity", ({ gutter }) => {
  let scope: ReturnType<typeof effectScope>;

  beforeEach(() => {
    vi.clearAllMocks();
    scope = effectScope();
  });

  afterEach(() => scope.stop());

  it("stores a string ID on the raw OpenLayers layer", () => {
    const data = ref<WMSLayer>({
      format: "WMS",
      layerId: "daten",
      uuid: "wms-instance",
      url: "https://example.test/wms",
      version: "1.3.0",
      gutter,
      opacity: 0.5,
      isVisible: true,
      lang: "de",
      dimensions: {},
    });

    scope.run(() => useOlWmsLayer(data, ref(undefined)));
    const layerRef = vi.mocked(useAddLayerToMap).mock.calls[0]?.[0];

    expect(toRaw(layerRef?.value)?.get("id")).toBe("daten");
  });
});
