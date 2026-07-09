import type { Layer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { LayerState } from "@swissgeo/statesharing";
import type { AppStatePayload } from "~/composables/useStateConfig";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import { usePositionStore } from "@swissgeo/map";
import { APP_STATE_CONFIG_VERSION } from "@swissgeo/statesharing";
import {
  isBackgroundLayer,
  layersToStateConfig,
  layerToStateConfig,
  useStateConfig,
} from "~/composables/useStateConfig";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMapLayers: MapLayer[] = [];

mockNuxtImport("useMapViewStore", () => () => ({
  mapLayers: mockMapLayers,
  backgroundLayer: null,
  addLayerToTop: (layer: MapLayer) => mockMapLayers.push(layer),
}));
const fetchMock = vi.fn();

vi.stubGlobal("$fetch", fetchMock);

vi.mock("@swissgeo/layers", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("@swissgeo/layers")>();

  return {
    ...actual,
    makeServerLayer: vi.fn(),
  };
});
function makeMapLayer(uuid: string): MapLayer {
  return { uuid, format: "WMTS", layerId: uuid, opacity: 1, isVisible: true };
}

const backgroundDataset: Layer = {
  uuid: "back-grou-ndoo-uuid-1",
  humanId: "bg-layer-1",
  type: "dataset",
  isLoading: false,
  layerUrl: "https://test.ch",
};
const backgroundLayer: MapLayer = {
  uuid: "back-grou-ndoo-uuid-1",
  format: "WMTS",
  opacity: 1,
  isVisible: true,
  zIndex: 0,
  displayName: "background layer 1",
  layerId: "ch.swisstopo.pixelkarte-grau",
};
const expectedBackgroundState: LayerState = {
  layerUrl: "https://test.ch",
  type: "dataset",
  dimensions: undefined,
  isVisible: true,
  opacity: 1,
};
const datasetsForStore: Layer[] = [];

const mockedMapLayers: MapLayer[] = [];

const expectedStatesConfig: LayerState[] = [];
for (let index = 0; index < 4; index++) {
  mockedMapLayers.push({
    uuid: `uuid-${index}`,
    format: "WMS",
    opacity: 1,
    isVisible: true,
    zIndex: 1,
    displayName: `layer ${index}`,
    layerId: `ch.test.layer${index}`,
  });
  datasetsForStore.push({
    uuid: `uuid-${index}`,
    humanId: `layer-${index}`,
    type: "dataset",
    isLoading: false,
    layerUrl: `https://test.ch/${index}`,
  });
  expectedStatesConfig.push({
    layerUrl: `https://test.ch/${index}`,
    type: "dataset",
    dimensions: undefined,
    isVisible: true,
    opacity: 1,
  });
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

describe("useStateConfig - Helper functions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
  });

  it.each`
    description                                                                    | input_partial_layer                               | expected_output
    ${"A layer with layer id ch.swisstopo.pixelkarte-grau is a background layer"}  | ${{ humanId: "ch.swisstopo.pixelkarte-grau" }}    | ${true}
    ${"A layer with layer id ch.swisstopo.pixelkarte-farbe is a background layer"} | ${{ humanId: "ch.swisstopo.pixelkarte-farbe" }}   | ${true}
    ${"A layer with layer id ch.swisstopo.swissimage is a background layer"}       | ${{ humanId: "ch.swisstopo.swissimage" }}         | ${true}
    ${"A layer with another layer id is not a background layer"}                   | ${{ humanId: "ch.swisstopo.cate-pixel-couleur" }} | ${false}
  `("$description", ({ _, input_partial_layer, expected_output }) => {
    const isItABackgroundLayer = isBackgroundLayer(input_partial_layer);
    expect(isItABackgroundLayer).to.eql(expected_output);
  });

  it("turn a single layer to a state configuration", () => {
    const layerStore = useLayerStore();
    layerStore.addLayer(datasetsForStore[0]!);
    const layer: MapLayer = mockedMapLayers[0]!;
    const layerStateConfig = layerToStateConfig(layer);
    const expectedLayerStateConfig = expectedStatesConfig[0]!;
    expect(layerStateConfig.layerUrl).to.eql(expectedLayerStateConfig.layerUrl);
    expect(layerStateConfig.type).to.eql(expectedLayerStateConfig.type);
    expect(layerStateConfig.dimensions).to.eql(
      expectedLayerStateConfig.dimensions,
    );
    expect(layerStateConfig.isVisible).to.eql(
      expectedLayerStateConfig.isVisible,
    );
    expect(layerStateConfig.opacity).to.eql(expectedLayerStateConfig.opacity);
  });

  it("turn a single background layer to a state configuration", () => {
    const layerStore = useLayerStore();
    layerStore.setBackground(backgroundDataset);

    const layerStateConfig = layerToStateConfig(backgroundLayer);
    const expectedLayerStateConfig = expectedBackgroundState;
    expect(layerStateConfig.layerUrl).to.eql(expectedLayerStateConfig.layerUrl);
    expect(layerStateConfig.type).to.eql(expectedLayerStateConfig.type);
    expect(layerStateConfig.dimensions).to.eql(
      expectedLayerStateConfig.dimensions,
    );
    expect(layerStateConfig.isVisible).to.eql(
      expectedLayerStateConfig.isVisible,
    );
    expect(layerStateConfig.opacity).to.eql(expectedLayerStateConfig.opacity);
  });

  it("turns each layer into a state confirguration, when there is a background layer", () => {
    const layerStore = useLayerStore();
    mockMapLayers.push(backgroundLayer);
    mockMapLayers.push(...mockedMapLayers);
    layerStore.layers.push(...datasetsForStore);

    layerStore.setBackground(backgroundDataset);

    const layerStateInputs: LayerState[] = layersToStateConfig(mockMapLayers);

    expect(layerStateInputs.length).to.eq(4);

    for (let index = 0; index < layerStateInputs.length; index++) {
      expect(layerStateInputs[index]!.layerUrl).to.eql(
        expectedStatesConfig[index]!.layerUrl,
      );
      expect(layerStateInputs[index]!.type).to.eql(
        expectedStatesConfig[index]!.type,
      );
      expect(layerStateInputs[index]!.dimensions).to.eql(
        expectedStatesConfig[index]!.dimensions,
      );
      expect(layerStateInputs[index]!.isVisible).to.eql(
        expectedStatesConfig[index]!.isVisible,
      );
      expect(layerStateInputs[index]!.opacity).to.eql(
        expectedStatesConfig[index]!.opacity,
      );
    }
  });

  it("turns each layer into a state confirguration, when there is no background layer", () => {
    const layerStore = useLayerStore();
    mockMapLayers.push(...mockedMapLayers);
    layerStore.layers.push(...datasetsForStore);

    const layerStateInputs: LayerState[] = layersToStateConfig(mockMapLayers);

    expect(layerStateInputs.length).to.eq(4);
    for (let index = 0; index < layerStateInputs.length; index++) {
      expect(layerStateInputs[index]!.layerUrl).to.eql(
        expectedStatesConfig[index]!.layerUrl,
      );
      expect(layerStateInputs[index]!.type).to.eql(
        expectedStatesConfig[index]!.type,
      );
      expect(layerStateInputs[index]!.dimensions).to.eql(
        expectedStatesConfig[index]!.dimensions,
      );
      expect(layerStateInputs[index]!.isVisible).to.eql(
        expectedStatesConfig[index]!.isVisible,
      );
      expect(layerStateInputs[index]!.opacity).to.eql(
        expectedStatesConfig[index]!.opacity,
      );
    }
  });

  it("layersToStateConfig returns an empty array if there are no layers", () => {
    const layerStateInputs = layersToStateConfig(mockMapLayers);
    expect(layerStateInputs.length).to.eql(0);
  });
  it("layersToStateConfig returns an empty array if there is only a bg layer", () => {
    const layerStore = useLayerStore();
    layerStore.setBackground(backgroundDataset);
    mockMapLayers.push(backgroundLayer);
    const layerStateInputs = layersToStateConfig(mockMapLayers);
    expect(layerStateInputs.length).to.eql(0);
  });
});

describe("useStateConfig > importState", () => {
  const mockedMakeServerLayer = vi.mocked(makeServerLayer);
  const mockedLayer: Layer = {
    uuid: "uuid-1",
    humanId: "layer",
    type: "dataset",
    layerUrl: "https://test.ch",
    isLoading: false,
  };
  mockedMakeServerLayer.mockReturnValue(mockedLayer);
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
  });

  it.each`
    description                                                                   | state                                                                                            | center                | zoom | rotation   | bg_layer       | layers
    ${"Load a default state when if has no information"}                          | ${{}}                                                                                            | ${[2660000, 1190000]} | ${1} | ${0}       | ${null}        | ${[]}
    ${"When map center is out of the bounding box, we have the default center"}   | ${{ map: { center: [0, 0] } }}                                                                   | ${[2660000, 1190000]} | ${1} | ${0}       | ${null}        | ${[]}
    ${"When map center is within bounds, the state has the correct center"}       | ${{ map: { center: [2660000, 1120000] } }}                                                       | ${[2660000, 1120000]} | ${1} | ${0}       | ${null}        | ${[]}
    ${"When zoom is set correctly in the payload, we find it again in the state"} | ${{ map: { zoom: 5 } }}                                                                          | ${[2660000, 1190000]} | ${5} | ${0}       | ${null}        | ${[]}
    ${"Rotation is set up correctly"}                                             | ${{ map: { rotation: Math.PI } }}                                                                | ${[2660000, 1190000]} | ${1} | ${Math.PI} | ${null}        | ${[]}
    ${"Rotation loop back to avoid angles greater than 2 times pi"}               | ${{ map: { rotation: Math.PI * 3 } }}                                                            | ${[2660000, 1190000]} | ${1} | ${Math.PI} | ${null}        | ${[]}
    ${"Roation loop back to avoid angles lower than 0"}                           | ${{ map: { rotation: -Math.PI } }}                                                               | ${[2660000, 1190000]} | ${1} | ${Math.PI} | ${null}        | ${[]}
    ${"Background Layer is set up correctly"}                                     | ${{ bg_layer: { layerUrl: "https://perdu.com", type: "dataset", isVisible: true, opacity: 1 } }} | ${[2660000, 1190000]} | ${1} | ${0}       | ${mockedLayer} | ${[]}
    ${"Layers are set up correctly"} | ${{
  layers: [
    {
      layerUrl: "https://perdu.com",
      type: "dataset",
      isVisible: true,
      opacity: 1,
    },
    {
      layerUrl: "https://perdu.com",
      type: "dataset",
      isVisible: true,
      opacity: 1,
    },
  ],
}} | ${[2660000, 1190000]} | ${1} | ${0} | ${null} | ${[mockedLayer, mockedLayer]}
  `(
    "$description",
    async ({ _, state, center, zoom, rotation, bg_layer, layers }) => {
      const payload: AppStatePayload = {
        version: APP_STATE_CONFIG_VERSION,
        state,
      };
      console.log(state);
      console.log(bg_layer);
      const positionStore = usePositionStore();
      const layerStore = useLayerStore();
      await useStateConfig().importState(payload);
      console.log(layerStore.backgroundLayer);
      expect(positionStore.center).to.eql(center);
      expect(positionStore.zoom).to.eql(zoom);
      expect(positionStore.rotation).to.eql(rotation);
      expect(layerStore.backgroundLayer).to.eql(bg_layer);
      expect(layerStore.layers).to.eql(layers);
      if (layerStore.layers.length > 0) {
        expect(layerStore.isThereImportOptions()).to.eq(true);
      }
    },
  );

  it("empty the current state when importing a new state", async () => {
    const layerStore = useLayerStore();
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {},
    };
    //mockMapLayers.push(backgroundLayer);
    //mockMapLayers.push(...mockedMapLayers);
    layerStore.setBackground(backgroundDataset);
    layerStore.layers.push(...datasetsForStore);
    await useStateConfig().importState(payload);

    expect(layerStore.backgroundLayer).to.eq(null);
    expect(layerStore.layers.length).to.eq(0);
  });

  it("useCustomStateConfig", () => {
    const layerStore = useLayerStore();
    mockMapLayers.push(backgroundLayer);
    mockMapLayers.push(...mockedMapLayers);
    layerStore.setBackground(backgroundDataset);
    layerStore.layers.push(...datasetsForStore);
    const positionStore = usePositionStore();
    positionStore.center = [2660000, 1120000];
    positionStore.zoom = 5;
    positionStore.rotation = Math.PI;
    const customState = useCustomStateConfig();

    expect(customState.customStateConfig.value.version).to.eq(
      APP_STATE_CONFIG_VERSION,
    );
    expect(customState.customStateMapCenter.value).toEqual([0, 0]);
    expect(customState.customStateMapRotation.value).to.eq(0);
    expect(customState.customStateMapZoom.value).to.eq(0);
  });
});
//describe("useStateConfig > exportState", () => {});
