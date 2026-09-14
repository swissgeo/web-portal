import type { Dataset } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useDatasetLayer } from "../useDatasetLayer";

const {
  layerStore,
  dimensionsStore,
  makeServerLayerMock,
  toastAddMock,
  logErrorMock,
} = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  return {
    layerStore: reactive({
      layers: [] as { uuid: string; humanId: string }[],
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    }),
    dimensionsStore: { clearLayerDimensions: vi.fn() },
    makeServerLayerMock: vi.fn((dataset: { id: string }) => ({
      uuid: `uuid-${dataset.id}`,
      humanId: dataset.id,
    })),
    toastAddMock: vi.fn(),
    logErrorMock: vi.fn(),
  };
});

mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));
mockNuxtImport("useToast", () => () => ({ add: toastAddMock }));

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
  makeServerLayer: makeServerLayerMock,
}));
vi.mock("@swissgeo/dimension", () => ({
  useDimensionsStore: () => dimensionsStore,
}));
vi.mock("@swissgeo/log", () => ({ default: { error: logErrorMock } }));

function makeDataset(id: string): Dataset {
  return { id, properties: { type: "Dataset", title: id }, links: [] };
}

describe("useDatasetLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    layerStore.layers = [];
  });

  it("is on the map once a layer made from the dataset is there", () => {
    layerStore.layers = [{ uuid: "u0", humanId: "ch.other" }];

    const { isOnMap } = useDatasetLayer(makeDataset("ch.a"));
    expect(isOnMap.value).toBe(false);

    layerStore.layers.push({ uuid: "u1", humanId: "ch.a" });
    expect(isOnMap.value).toBe(true);
  });

  it("follows the dataset it is given", () => {
    layerStore.layers = [{ uuid: "u1", humanId: "ch.b" }];
    const dataset = ref(makeDataset("ch.a"));

    const { isOnMap } = useDatasetLayer(dataset);
    expect(isOnMap.value).toBe(false);

    dataset.value = makeDataset("ch.b");
    expect(isOnMap.value).toBe(true);
  });

  it("adds a layer made from the dataset to the map", () => {
    const dataset = makeDataset("ch.a");

    useDatasetLayer(() => dataset).addToMap();

    expect(makeServerLayerMock).toHaveBeenCalledWith(dataset);
    expect(layerStore.addLayer).toHaveBeenCalledWith({
      uuid: "uuid-ch.a",
      humanId: "ch.a",
    });
  });

  it("tells the user when the layer cannot be made from the dataset", () => {
    const error = new Error("unsupported distribution");
    makeServerLayerMock.mockImplementationOnce(() => {
      throw error;
    });

    useDatasetLayer(makeDataset("ch.a")).addToMap();

    expect(layerStore.addLayer).not.toHaveBeenCalled();
    expect(logErrorMock).toHaveBeenCalledWith(
      "Failed to add catalog layer to map",
      error,
    );
    expect(toastAddMock).toHaveBeenCalledWith({
      color: "error",
      title: "dataset.addToMapError",
    });
  });

  it("removes the layer and its dimensions from the map", () => {
    layerStore.layers = [{ uuid: "u1", humanId: "ch.a" }];

    useDatasetLayer(makeDataset("ch.a")).removeFromMap();

    expect(dimensionsStore.clearLayerDimensions).toHaveBeenCalledWith("u1");
    expect(layerStore.removeLayer).toHaveBeenCalledWith("u1");
  });

  it("does nothing when removing a dataset that is not on the map", () => {
    layerStore.layers = [{ uuid: "u1", humanId: "ch.other" }];

    useDatasetLayer(makeDataset("ch.a")).removeFromMap();

    expect(dimensionsStore.clearLayerDimensions).not.toHaveBeenCalled();
    expect(layerStore.removeLayer).not.toHaveBeenCalled();
  });
});
