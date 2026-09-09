import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchSelection } from "../useSearchSelection";

const {
  fetchMock,
  layerStore,
  makeServerLayerMock,
  toastAddMock,
  windowOpenMock,
} = vi.hoisted(() => ({
  windowOpenMock: vi.fn(),
  fetchMock: vi.fn(),
  layerStore: { layers: [] as { humanId: string }[], addLayer: vi.fn() },
  makeServerLayerMock: vi.fn((dataset: { id: string }) => ({
    humanId: dataset.id,
  })),
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
    cmsBaseUrl: "https://cms.example.test",
  },
}));

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
  makeServerLayer: makeServerLayerMock,
}));

vi.mock("@swissgeo/map", () => ({
  usePositionStore: () => ({
    setCenter: vi.fn(),
    setZoom: vi.fn(),
  }),
}));

const layerResult = {
  resultType: "LAYER",
  id: "ch.layer.one",
  layerId: "ch.layer.one",
} as never;

const contentResult = {
  resultType: "CONTENT",
  id: "content-373",
  documentId: "373",
  slug: "daten-beziehen-download-dienst",
  locale: "de",
  title: "Daten beziehen: Download-Dienst",
  sanitizedTitle: "Daten beziehen: Download-Dienst",
  description: "Laden Sie Geodaten als Dateien herunter.",
} as never;

describe("useSearchSelection", () => {
  beforeEach(() => {
    (process as { client?: boolean }).client = true;
    layerStore.layers = [];
    layerStore.addLayer.mockReset();
    toastAddMock.mockReset();
    fetchMock.mockReset();
    windowOpenMock.mockReset();
    vi.stubGlobal("open", windowOpenMock);
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

  it("opens the published CMS page in a new tab", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(contentResult);

    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://cms.example.test/de/daten-beziehen-download-dienst",
      "_blank",
      "noopener",
    );
  });

  it("uses the locale of the page rather than the interface locale", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection({
      ...contentResult,
      locale: "fr",
      slug: "theme-neige",
    } as never);

    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://cms.example.test/fr/theme-neige",
      "_blank",
      "noopener",
    );
  });

  it("does nothing when the page has no slug to link to", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection({ ...contentResult, slug: "" } as never);

    expect(windowOpenMock).not.toHaveBeenCalled();
  });

  it("leaves the map alone when a content page is selected", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(contentResult);

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
