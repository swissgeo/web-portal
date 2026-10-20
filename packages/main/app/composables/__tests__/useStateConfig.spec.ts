import type { FeatureData } from "@swissgeo/feature";
import type { Layer } from "@swissgeo/layers";
import type { Layer as MapLayer } from "@swissgeo/map";
import type { DrawingLayerState, LayerState } from "@swissgeo/statesharing";
import type { AppStatePayload } from "~/composables/useStateConfig";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useDimensionsStore } from "@swissgeo/dimension";
import { useFeaturesStore } from "@swissgeo/feature";
import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import { usePositionStore } from "@swissgeo/map";
import { DRAWING_LAYER_ID } from "@swissgeo/shared";
import { APP_STATE_CONFIG_VERSION } from "@swissgeo/statesharing";
import { flushPromises, mount } from "@vue/test-utils";
import {
  isBackgroundLayer,
  isDrawingLayerState,
  layersToStateConfig,
  layerToStateConfig,
  useCustomStateConfig,
  useStateConfig,
} from "~/composables/useStateConfig";
import { useDrawingImportStore } from "~/stores/drawingImport";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

const mockMapLayers: MapLayer[] = [];

function expectRegularLayerState(
  state: LayerState | DrawingLayerState | null,
): LayerState {
  expect(state).not.toBeNull();
  if (!state || isDrawingLayerState(state)) {
    throw new Error("expected a regular layer state");
  }
  return state;
}

mockNuxtImport("useMapViewStore", () => () => ({
  mapLayers: mockMapLayers,
  backgroundLayer: null,
  addLayerToTop: (layer: MapLayer) => mockMapLayers.push(layer),
}));

const { setCenterMock, setZoomMock, setRotationMock, fetchMock } = vi.hoisted(
  () => ({
    setCenterMock: vi.fn(),
    setZoomMock: vi.fn(),
    setRotationMock: vi.fn(),
    fetchMock: vi.fn(),
  }),
);

const { olMapRef } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { olMapRef: ref<{ id: string } | null>({ id: "fake-ol-map" }) };
});

mockNuxtImport("$fetch", () => fetchMock);

const { runtimeConfigMock } = vi.hoisted(() => ({
  runtimeConfigMock: {
    public: {
      drawingServiceEndpoint: "https://drawings.test/api/drawings",
      drawingAllowedDomains: ["drawings.test"],
    },
  },
}));

mockNuxtImport("useRuntimeConfig", () => () => runtimeConfigMock);

mockNuxtImport("useNuxtApp", () => () => ({
  $i18n: {
    t: (key: string, params?: Record<string, string>) =>
      params?.id ? `${key}:${params.id}` : key,
  },
}));

const { showWarningMock } = vi.hoisted(() => ({
  showWarningMock: vi.fn(),
}));

mockNuxtImport("useToaster", () => () => ({
  showError: vi.fn(),
  showWarning: showWarningMock,
}));

const { importKmzSpy, mountDrawingLayerSpy } = vi.hoisted(() => ({
  importKmzSpy: vi.fn(),
  mountDrawingLayerSpy: vi.fn(),
}));

vi.mock("@swissgeo/drawing", () => ({
  useDrawing: vi.fn(() => ({
    importKmz: importKmzSpy,
    mountDrawingLayer: mountDrawingLayerSpy,
    DRAWING_LAYER_UUID: "drawing-layer-uuid",
  })),
}));

vi.mock("@swissgeo/map", async (importOriginal) => {
  const original = await importOriginal();

  return {
    // @ts-expect-error Spreading this actually works and is foreseen by the docs
    ...original,
    usePositionStore: () => ({
      // @ts-expect-error Spreading this actually works and is foreseen by the docs
      ...original.usePositionStore(),
      setCenter: setCenterMock,
      setZoom: setZoomMock,
      setRotation: setRotationMock,
    }),
    useMap: () => ({
      olMap: olMapRef,
    }),
  };
});

vi.mock("@swissgeo/layers", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("@swissgeo/layers")>();

  return {
    ...actual,
    makeServerLayer: vi.fn(),
  };
});

const { createIdentifyResponseMock } = vi.hoisted(() => ({
  createIdentifyResponseMock: vi.fn(),
}));

vi.mock("@swissgeo/feature", async (importOriginal) => {
  // the store itself stays real; only the network-touching identify helper is
  // mocked, so assertions can read the resulting preselection back from the store
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("@swissgeo/feature")>();

  return {
    ...actual,
    createIdentifyResponse: createIdentifyResponseMock,
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

describe("useStateConfig manages to export time dimension from State", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
  });

  function setupLayerWithTimeValue(currentValue: string | null) {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    const uuid = "test-layer";

    layerStore.addLayer({
      uuid,
      humanId: uuid,
      type: "dataset",
      isLoading: false,
      layerUrl: "https://example.com/layer",
    });
    dimensionsStore.setDimension(uuid, "time", {
      availableValues: [],
      currentValue,
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

      const layer = exportState.value.state.layers?.[0];
      if (!layer || !("layerUrl" in layer)) {
        throw new Error("expected non-drawing layer");
      }
      expect(layer.dimensions?.time?.currentValue).toBe(value);
    },
  );
});

describe("useStateConfig - Helper functions are functional", () => {
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
    const layerStateConfig = expectRegularLayerState(layerToStateConfig(layer));
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

    const layerStateConfig = expectRegularLayerState(
      layerToStateConfig(backgroundLayer),
    );
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

    const layerStateInputs = layersToStateConfig(mockMapLayers).map(
      expectRegularLayerState,
    );

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

    const layerStateInputs = layersToStateConfig(mockMapLayers).map(
      expectRegularLayerState,
    );

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

describe("useStateConfig manages to import a State with importState", () => {
  const mockedMakeServerLayer = vi.mocked(makeServerLayer);
  const mockedLayer: Layer = {
    uuid: "uuid-1",
    humanId: "layer",
    type: "dataset",
    layerUrl: "https://test.ch",
    isLoading: false,
  };
  mockedMakeServerLayer.mockResolvedValue(mockedLayer);
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
    vi.clearAllMocks();
    createIdentifyResponseMock.mockReset();
  });

  it("Does not change the app state when the importe state has no information", async () => {
    const state = {};

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state,
    };

    await useStateConfig().importState(payload);
    expect(setCenterMock).not.toHaveBeenCalled();
    expect(setZoomMock).not.toHaveBeenCalled();
    expect(setRotationMock).not.toHaveBeenCalled();
  });

  it("When map center is within bounds, the state has the correct center", async () => {
    const state = { map: { center: [2660000, 1120000] as [number, number] } };

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state,
    };

    await useStateConfig().importState(payload);
    expect(setCenterMock).toHaveBeenCalledWith([2660000, 1120000], {
      name: "state-config",
    });
  });

  it("When zoom is set correctly in the payload, we find it again in the state", async () => {
    const state = { map: { zoom: 5 } };

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state,
    };

    await useStateConfig().importState(payload);
    expect(setZoomMock).toHaveBeenCalledWith(5, { name: "state-config" });
  });

  it.each([Math.PI, Math.PI * 3, -Math.PI])(
    "passes rotation %s through to the position store unchanged",
    async (rotation) => {
      const state = { map: { rotation } };

      const payload: AppStatePayload = {
        version: APP_STATE_CONFIG_VERSION,
        state,
      };

      await useStateConfig().importState(payload);
      expect(setRotationMock).toHaveBeenCalledWith(rotation, {
        name: "state-config",
      });
    },
  );

  it.each`
    description                               | state                                                                                            | bg_layer       | layers
    ${"Background Layer is set up correctly"} | ${{ bg_layer: { layerUrl: "https://perdu.com", type: "dataset", isVisible: true, opacity: 1 } }} | ${mockedLayer} | ${[]}
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
}} | ${null} | ${[mockedLayer, mockedLayer]}
  `("$description", async ({ _, state, bg_layer, layers }) => {
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state,
    };

    const layerStore = useLayerStore();
    await useStateConfig().importState(payload);

    expect(layerStore.backgroundLayer).to.eql(bg_layer);
    expect(layerStore.layers).to.eql(layers);

    if (layerStore.layers.length > 0) {
      expect(layerStore.isThereImportOptions()).to.eq(true);
    }
  });

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

  it("clears existing layer dimensions when importing a new state", async () => {
    const layerStore = useLayerStore();
    const dimensionsStore = useDimensionsStore();
    const existingLayer = datasetsForStore[0]!;
    layerStore.addLayer(existingLayer);
    dimensionsStore.setDimension(existingLayer.uuid, "time", {
      currentValue: "2024",
      availableValues: ["2024"],
    });
    expect(
      dimensionsStore.getDimensions(existingLayer.uuid)?.time,
    ).toBeTruthy();

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {},
    };
    await useStateConfig().importState(payload);

    expect(dimensionsStore.getDimensions(existingLayer.uuid)).toBeUndefined();
  });

  it("clears WMS capability registrations when importing a new state", async () => {
    const layerStore = useLayerStore();
    const featureStore = useFeaturesStore();
    const existingLayer = datasetsForStore[0]!;
    layerStore.addLayer(existingLayer);
    featureStore.setWmsCapability(existingLayer.uuid, {
      getFeatureInfoCapability: {
        baseUrl: "https://example.test/wms?",
        method: "GET",
        formats: ["application/json"],
      },
      availableCrs: ["EPSG:2056"],
      layerName: null,
    });
    expect(featureStore.getWmsCapability(existingLayer.uuid)).toBeDefined();

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {},
    };
    await useStateConfig().importState(payload);

    expect(featureStore.getWmsCapability(existingLayer.uuid)).toBeUndefined();
  });

  it("writes time dimensions from the incoming state into the dimensions store", async () => {
    const dimensionsStore = useDimensionsStore();
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            layerUrl: "https://perdu.com",
            type: "dataset",
            isVisible: true,
            opacity: 1,
            dimensions: {
              time: { currentValue: "20240101" },
            },
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    const uuid = mockedLayer.uuid;
    const timeDimension = dimensionsStore.getDimensions(uuid)?.time;
    expect(timeDimension).toEqual({
      currentValue: "20240101",
      availableValues: [],
    });
  });

  it("does not set a time dimension when the incoming layer has no time dimension", async () => {
    const dimensionsStore = useDimensionsStore();
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            layerUrl: "https://perdu.com",
            type: "dataset",
            isVisible: true,
            opacity: 1,
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(
      dimensionsStore.getDimensions(mockedLayer.uuid)?.time,
    ).toBeUndefined();
  });

  it("drops incoming layers that have no layerUrl", async () => {
    const layerStore = useLayerStore();
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            layerUrl: "",
            type: "dataset",
            isVisible: true,
            opacity: 1,
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(layerStore.layers).toEqual([]);
  });

  it("restores the incoming feature ids as a preselection on the feature store", async () => {
    createIdentifyResponseMock.mockReturnValue([
      { id: "id-1", geometry: { type: "Point", coordinates: [0, 0] } },
      { id: "id-2", geometry: { type: "Point", coordinates: [1, 1] } },
    ]);
    const featureStore = useFeaturesStore();
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            layerUrl: "https://perdu.com",
            type: "dataset",
            isVisible: true,
            opacity: 1,
            features: ["id-1", "id-2"],
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(createIdentifyResponseMock).toHaveBeenCalledWith(
      ["id-1", "id-2"],
      mockedLayer.humanId,
    );
    expect(featureStore.consumeFeaturePreselection(mockedLayer.uuid)).toEqual([
      { id: "id-1", geometry: { type: "Point", coordinates: [0, 0] } },
      { id: "id-2", geometry: { type: "Point", coordinates: [1, 1] } },
    ]);
  });

  it("does not query identify features when the incoming layer has none", async () => {
    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            layerUrl: "https://perdu.com",
            type: "dataset",
            isVisible: true,
            opacity: 1,
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(createIdentifyResponseMock).not.toHaveBeenCalled();
  });

  it("builds custom state from current layers and background after mount", async () => {
    const layerStore = useLayerStore();
    mockMapLayers.push(backgroundLayer);
    mockMapLayers.push(...mockedMapLayers);
    layerStore.setBackground(backgroundDataset);
    layerStore.layers.push(...datasetsForStore);
    const positionStore = usePositionStore();
    positionStore.center = [2660000, 1120000];
    positionStore.zoom = 5;
    positionStore.rotation = Math.PI;
    let customState!: ReturnType<typeof useCustomStateConfig>;

    const wrapper = mount(
      defineComponent({
        setup() {
          customState = useCustomStateConfig();
          return () => h("div");
        },
      }),
    );
    await nextTick();

    expect(customState.customStateConfig.value.version).to.eq(
      APP_STATE_CONFIG_VERSION,
    );
    expect(customState.customStateMapCenter.value).toEqual([0, 0]);
    expect(customState.customStateMapRotation.value).to.eq(0);
    expect(customState.customStateMapZoom.value).to.eq(0);
    expect(customState.customStateConfig.value.state.layers).toEqual(
      expectedStatesConfig,
    );
    expect(customState.customStateConfig.value.state.bg_layer).toEqual(
      expectedBackgroundState,
    );

    wrapper.unmount();
  });
});
//describe("useStateConfig > exportState", () => {});

describe("useStateConfig exports selected shareable features", () => {
  const shareableFeature: FeatureData = {
    featureId: "feature-shareable",
    geometry: { type: "Point", coordinates: [0, 0] },
    content: {
      kind: "html",
      html: "<p>popup</p>",
      trusted: true,
      shareable: true,
    },
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
  });

  it("writes the shareable feature ids of a layer into its state config", () => {
    const layerStore = useLayerStore();
    const featureStore = useFeaturesStore();
    layerStore.addLayer(datasetsForStore[0]!);
    featureStore.setSelection({ "uuid-0": [shareableFeature] });
    mockMapLayers.push(mockedMapLayers[0]!);

    const layerStateConfig = expectRegularLayerState(
      layerToStateConfig(mockedMapLayers[0]!),
    );

    expect(layerStateConfig.features).toEqual(["feature-shareable"]);
  });

  it("omits the features key when the layer has no selected feature", () => {
    const layerStore = useLayerStore();
    layerStore.addLayer(datasetsForStore[0]!);
    mockMapLayers.push(mockedMapLayers[0]!);

    const layerStateConfig = layerToStateConfig(mockedMapLayers[0]!)!;

    expect(layerStateConfig).not.toHaveProperty("features");
  });
});

describe("useStateConfig drawing layer state", () => {
  const drawingMapLayer: MapLayer = {
    uuid: "drawing-layer-uuid",
    format: "KML",
    layerId: DRAWING_LAYER_ID,
    opacity: 0.5,
    isVisible: false,
    displayName: "Drawing layer",
  };
  const drawingSourceLayer: Layer = {
    uuid: "drawing-layer-uuid",
    humanId: DRAWING_LAYER_ID,
    type: "kml",
    isLoading: false,
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    mockMapLayers.length = 0;
    vi.clearAllMocks();
    importKmzSpy.mockResolvedValue(true);
    fetchMock.mockReset();
    olMapRef.value = { id: "fake-ol-map" };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports the drawing layer as a drawing state when synced", () => {
    const layerStore = useLayerStore();
    const drawingImportStore = useDrawingImportStore();
    layerStore.addLayer(drawingSourceLayer);
    mockMapLayers.push(drawingMapLayer);
    drawingImportStore.drawingId = "11111111-2222-3333-4444-555555555555";
    drawingImportStore.drawingAdminId = "admin-id-6666";

    const state = layerToStateConfig(drawingMapLayer);

    expect(state).toEqual({
      drawingUrl:
        "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
      type: "drawing",
      adminId: "admin-id-6666",
      isVisible: false,
      opacity: 0.5,
    });
  });

  it("skips the drawing layer when it was never synced", () => {
    const layerStore = useLayerStore();
    layerStore.addLayer(drawingSourceLayer);
    mockMapLayers.push(drawingMapLayer);

    expect(layerToStateConfig(drawingMapLayer)).toBeNull();
    expect(layersToStateConfig(mockMapLayers)).toEqual([]);
  });

  it("tells drawing states apart from regular layer states", () => {
    expect(isDrawingLayerState(expectedStatesConfig[0]!)).toBe(false);
    expect(
      isDrawingLayerState({
        drawingUrl:
          "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
        type: "drawing",
      }),
    ).toBe(true);
  });

  it("imports a drawing state: validates the admin id, fetches the kmz and seeds the drawing ids", async () => {
    const fetchMockGlobal = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/check-auth")) {
        return Promise.resolve({ ok: true, status: 204, statusText: "" });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
            adminId: "admin-id-6666",
            isVisible: false,
            opacity: 0.5,
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    const authCall = fetchMockGlobal.mock.calls.find(([url]) =>
      String(url).endsWith("/check-auth"),
    );
    expect(authCall).toBeDefined();
    expect(
      (authCall![1] as { headers: Headers }).headers.get("Swissgeo-Admin-Id"),
    ).toBe("admin-id-6666");
    expect(fetchMockGlobal).toHaveBeenCalledWith(
      "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
    );
    expect(mountDrawingLayerSpy).toHaveBeenCalledOnce();
    expect(importKmzSpy).toHaveBeenCalledWith(expect.any(ArrayBuffer), true);

    const drawingImportStore = useDrawingImportStore();
    expect(drawingImportStore.drawingId).toBe(
      "11111111-2222-3333-4444-555555555555",
    );
    expect(drawingImportStore.drawingAdminId).toBe("admin-id-6666");
  });

  it.each([401, 403])(
    "loads the drawing view-only when the admin id is rejected with %s",
    async (authStatus) => {
      const fetchMockGlobal = vi.fn().mockImplementation((url: string) => {
        if (url.endsWith("/check-auth")) {
          return Promise.resolve({
            ok: true,
            status: authStatus,
            statusText: "",
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        });
      });
      vi.stubGlobal("fetch", fetchMockGlobal);

      const payload: AppStatePayload = {
        version: APP_STATE_CONFIG_VERSION,
        state: {
          layers: [
            {
              drawingUrl:
                "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
              type: "drawing",
              adminId: "revoked-admin-id",
            },
          ],
        },
      };

      await useStateConfig().importState(payload);

      expect(mountDrawingLayerSpy).toHaveBeenCalledOnce();
      const drawingImportStore = useDrawingImportStore();
      expect(drawingImportStore.drawingId).toBe(
        "11111111-2222-3333-4444-555555555555",
      );
      expect(drawingImportStore.drawingAdminId).toBe("");
    },
  );

  it("loads the drawing view-only and skips the auth check when the admin id is empty", async () => {
    const fetchMockGlobal = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(fetchMockGlobal).not.toHaveBeenCalledWith(
      expect.stringContaining("check-auth"),
      expect.anything(),
    );
    const drawingImportStore = useDrawingImportStore();
    expect(drawingImportStore.drawingId).toBe(
      "11111111-2222-3333-4444-555555555555",
    );
    expect(drawingImportStore.drawingAdminId).toBe("");
  });

  it("does not add any drawing when the state has no drawing entries", async () => {
    const fetchMockGlobal = vi.fn();
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [],
      },
    };

    await useStateConfig().importState(payload);

    expect(fetchMockGlobal).not.toHaveBeenCalled();
    expect(mountDrawingLayerSpy).not.toHaveBeenCalled();
    expect(importKmzSpy).not.toHaveBeenCalled();
  });

  it("restores multiple drawing entries, clearing only before the first one", async () => {
    const fetchMockGlobal = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/check-auth")) {
        return Promise.resolve({ ok: true, status: 204, statusText: "" });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
          },
          {
            drawingUrl:
              "https://drawings.test/api/drawings/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            type: "drawing",
            adminId: "admin-id-6666",
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(importKmzSpy).toHaveBeenCalledTimes(2);
    expect(importKmzSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(ArrayBuffer),
      true,
    );
    expect(importKmzSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(ArrayBuffer),
      false,
    );
    expect(mountDrawingLayerSpy).toHaveBeenCalledTimes(2);

    const drawingImportStore = useDrawingImportStore();
    expect(drawingImportStore.drawingId).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
    expect(drawingImportStore.drawingAdminId).toBe("admin-id-6666");
  });

  it("skips a drawing whose kmz fetch answers 404, warns the user and restores the others", async () => {
    const fetchMockGlobal = vi.fn().mockImplementation((url: string) => {
      if (url.includes("11111111-2222")) {
        return Promise.resolve({ ok: false, status: 404, statusText: "" });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
          },
          {
            drawingUrl:
              "https://drawings.test/api/drawings/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            type: "drawing",
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(showWarningMock).toHaveBeenCalledWith(
      "state.drawingNotFound:11111111-2222-3333-4444-555555555555",
    );
    expect(importKmzSpy).toHaveBeenCalledOnce();
    expect(useDrawingImportStore().drawingId).toBe(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    );
  });

  it("defers the drawing restore until the map is ready", async () => {
    olMapRef.value = null;
    const fetchMockGlobal = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
          },
        ],
      },
    };

    await useStateConfig().importState(payload);

    expect(fetchMockGlobal).not.toHaveBeenCalled();
    expect(mountDrawingLayerSpy).not.toHaveBeenCalled();

    olMapRef.value = { id: "fake-ol-map" };
    await flushPromises();

    expect(fetchMockGlobal).toHaveBeenCalledWith(
      "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
    );
    expect(mountDrawingLayerSpy).toHaveBeenCalledOnce();
  });

  it("warns the user about a missing drawing restored after the map became ready", async () => {
    olMapRef.value = null;
    const fetchMockGlobal = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "",
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
          },
        ],
      },
    };

    await useStateConfig().importState(payload);
    expect(showWarningMock).not.toHaveBeenCalled();

    olMapRef.value = { id: "fake-ol-map" };
    await flushPromises();

    expect(showWarningMock).toHaveBeenCalledWith(
      "state.drawingNotFound:11111111-2222-3333-4444-555555555555",
    );
    expect(mountDrawingLayerSpy).not.toHaveBeenCalled();
  });

  it("rejects a drawing url whose host is not allowed and skips the drawing", async () => {
    const fetchMockGlobal = vi.fn();
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl: "https://evil.example.com/api/drawings/some-id",
            type: "drawing",
          },
        ],
      },
    };

    await expect(useStateConfig().importState(payload)).resolves.not.toThrow();
    expect(fetchMockGlobal).not.toHaveBeenCalled();
    expect(mountDrawingLayerSpy).not.toHaveBeenCalled();
  });

  it("logs a warning and skips the drawing when the fetch fails", async () => {
    const fetchMockGlobal = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl:
              "https://drawings.test/api/drawings/11111111-2222-3333-4444-555555555555",
            type: "drawing",
          },
        ],
      },
    };

    await expect(useStateConfig().importState(payload)).resolves.not.toThrow();
    expect(mountDrawingLayerSpy).not.toHaveBeenCalled();
  });

  it("logs a warning and skips the drawing when the drawing id is empty", async () => {
    const fetchMockGlobal = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    vi.stubGlobal("fetch", fetchMockGlobal);

    const payload: AppStatePayload = {
      version: APP_STATE_CONFIG_VERSION,
      state: {
        layers: [
          {
            drawingUrl: "https://drawings.test/api/drawings/",
            type: "drawing",
          },
        ],
      },
    };

    await expect(useStateConfig().importState(payload)).resolves.not.toThrow();
    expect(mountDrawingLayerSpy).not.toHaveBeenCalled();
    expect(useDrawingImportStore().drawingId).toBe("");
  });
});
