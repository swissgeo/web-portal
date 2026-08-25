import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchSelection } from "../useSearchSelection";

const {
  fetchMock,
  layerStore,
  makeServerLayerMock,
  positionStore,
  searchStore,
  toastAddMock,
} = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  layerStore: { layers: [] as { humanId: string }[], addLayer: vi.fn() },
  makeServerLayerMock: vi.fn((dataset: { id: string }) => ({
    humanId: dataset.id,
  })),
  positionStore: { setCenter: vi.fn(), setZoom: vi.fn() },
  searchStore: { setPinnedCoordinate: vi.fn() },
  toastAddMock: vi.fn(),
}));

mockNuxtImport("$fetch", () => fetchMock);

mockNuxtImport("useI18n", () => () => ({
  locale: { value: "de" },
  t: (key: string) => key,
}));

mockNuxtImport("useToast", () => () => ({ add: toastAddMock }));

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: {
    ogcApiEndpoint: "https://api.example.com",
    ogcCatalogCollection: "swissgeo-catalog",
  },
}));

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
  makeServerLayer: makeServerLayerMock,
}));

vi.mock("@swissgeo/map", () => ({
  usePositionStore: () => positionStore,
}));

vi.mock("@swissgeo/skeleton", () => ({
  useSearchStore: () => searchStore,
}));

const layerResult = {
  resultType: "LAYER",
  id: "ch.layer.one",
  layerId: "ch.layer.one",
} as never;

describe("useSearchSelection", () => {
  beforeEach(() => {
    (process as { client?: boolean }).client = true;
    layerStore.layers = [];
    layerStore.addLayer.mockReset();
    toastAddMock.mockReset();
    fetchMock.mockReset();
    positionStore.setCenter.mockReset();
    positionStore.setZoom.mockReset();
    searchStore.setPinnedCoordinate.mockReset();
  });

  it("goes to a coordinate result and marks it on the map", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection({
      resultType: "COORDINATE",
      id: "coordinate-2600000,1200000",
      coordinate: [2600000, 1200000],
      zoom: 8,
    } as never);

    const dispatcher = { name: "search-coordinate-selection" };
    expect(positionStore.setCenter).toHaveBeenCalledWith(
      [2600000, 1200000],
      dispatcher,
    );
    expect(positionStore.setZoom).toHaveBeenCalledWith(8, dispatcher);
    expect(searchStore.setPinnedCoordinate).toHaveBeenCalledWith([
      2600000, 1200000,
    ]);
  });

  it("fetches the dataset and adds it to the map when a layer result is selected", async () => {
    fetchMock.mockResolvedValue({ id: "ch.layer.one" });

    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(layerResult);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/collections/swissgeo-catalog/items/ch.layer.one?lang=de",
    );
    expect(layerStore.addLayer).toHaveBeenCalledWith({
      humanId: "ch.layer.one",
    });
  });

  it("does nothing when the layer is already on the map", async () => {
    layerStore.layers = [{ humanId: "ch.layer.one" }];

    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(layerResult);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(layerStore.addLayer).not.toHaveBeenCalled();
  });

  it("shows an error toast when the dataset cannot be fetched", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));

    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(layerResult);

    expect(layerStore.addLayer).not.toHaveBeenCalled();
    expect(toastAddMock).toHaveBeenCalledWith({
      color: "error",
      title: "dataset.addToMapError",
    });
  });
});
