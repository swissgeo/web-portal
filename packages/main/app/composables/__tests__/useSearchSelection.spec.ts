import type { ContentSearchResult } from "@swissgeo/search";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSearchSelection } from "../useSearchSelection";

const {
  fetchMock,
  layerStore,
  makeServerLayerMock,
  navigateToMock,
  positionStore,
  route,
  searchStore,
  sidebarStore,
  toastAddMock,
  windowOpenMock,
} = vi.hoisted(() => ({
  windowOpenMock: vi.fn(),
  navigateToMock: vi.fn(),
  route: { meta: {} as { datasetDetail?: boolean } },
  sidebarStore: { setSidebar: vi.fn() },
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

mockNuxtImport("useToaster", () => () => ({ add: toastAddMock }));
mockNuxtImport("useRoute", () => () => route);
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);
mockNuxtImport("navigateTo", () => navigateToMock);

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: {
    ogcApiEndpoint: "https://api.example.com",
    ogcCatalogCollection: "swissgeo-catalog",
    // deliberately trailing: the CMS links must not come out with a double
    // slash when the base URL is written this way
    cmsBaseUrl: "https://cms.example.test/",
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
  SidebarType: { LAYER_CART: "layer-cart" },
  useSearchStore: () => searchStore,
  useSidebarStore: () => sidebarStore,
}));

const layerResult = {
  resultType: "LAYER",
  id: "ch.layer.one",
  layerId: "ch.layer.one",
} as never;

const contentResult: ContentSearchResult = {
  resultType: "CONTENT",
  id: "content-373",
  documentId: "373",
  slug: "daten-beziehen-download-dienst",
  locale: "de",
  title: "Daten beziehen: Download-Dienst",
  sanitizedTitle: "Daten beziehen: Download-Dienst",
  description: "Laden Sie Geodaten als Dateien herunter.",
};

describe("useSearchSelection", () => {
  beforeEach(() => {
    layerStore.layers = [];
    layerStore.addLayer.mockReset();
    toastAddMock.mockReset();
    fetchMock.mockReset();
    positionStore.setCenter.mockReset();
    positionStore.setZoom.mockReset();
    searchStore.setPinnedCoordinate.mockReset();
    windowOpenMock.mockReset();
    navigateToMock.mockReset();
    sidebarStore.setSidebar.mockReset();
    route.meta = {};
    vi.stubGlobal("open", windowOpenMock);
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

  it("pins a place result, so the pin follows the map", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection({
      resultType: "LOCATION",
      id: "location-matterhorn",
      featureId: "matterhorn",
      coordinate: [2617000, 1091000],
      zoom: 9,
    } as never);

    expect(positionStore.setCenter).toHaveBeenCalledWith([2617000, 1091000], {
      name: "search-result-selection",
    });
    expect(searchStore.setPinnedCoordinate).toHaveBeenCalledWith([
      2617000, 1091000,
    ]);
  });

  it("pins a feature result too", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection({
      resultType: "FEATURE",
      id: "feature-1",
      featureId: "1",
      layerId: "ch.layer.one",
      layerName: "Layer one",
      coordinate: [2650000, 1200000],
      zoom: 12,
    } as never);

    expect(searchStore.setPinnedCoordinate).toHaveBeenCalledWith([
      2650000, 1200000,
    ]);
  });

  it("leaves the pin where it is when a result carries no coordinate", async () => {
    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection({
      resultType: "LOCATION",
      id: "location-nowhere",
      featureId: "nowhere",
      zoom: 9,
    } as never);

    expect(positionStore.setCenter).not.toHaveBeenCalled();
    expect(searchStore.setPinnedCoordinate).not.toHaveBeenCalled();
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

  it.each`
    case                            | layers
    ${"adds the layer"}             | ${[]}
    ${"finds the layer on the map"} | ${[{ humanId: "ch.layer.one" }]}
  `(
    "closes the DetailView and opens the map panel when it $case",
    async ({ layers }) => {
      layerStore.layers = layers;
      route.meta = { datasetDetail: true };
      fetchMock.mockResolvedValue({ id: "ch.layer.one" });

      const { handleResultSelection } = useSearchSelection();
      await handleResultSelection(layerResult);

      expect(sidebarStore.setSidebar).toHaveBeenCalledWith("layer-cart");
      expect(navigateToMock).toHaveBeenCalledWith("/de/map");
    },
  );

  it("stays on the page when no DetailView is open", async () => {
    fetchMock.mockResolvedValue({ id: "ch.layer.one" });

    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(layerResult);

    expect(layerStore.addLayer).toHaveBeenCalled();
    expect(sidebarStore.setSidebar).not.toHaveBeenCalled();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("keeps the DetailView open when the layer cannot be added", async () => {
    route.meta = { datasetDetail: true };
    fetchMock.mockRejectedValue(new Error("boom"));

    const { handleResultSelection } = useSearchSelection();
    await handleResultSelection(layerResult);

    expect(navigateToMock).not.toHaveBeenCalled();
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
    const frenchPage: ContentSearchResult = {
      ...contentResult,
      locale: "fr",
      slug: "theme-neige",
    };
    await handleResultSelection(frenchPage);

    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://cms.example.test/fr/theme-neige",
      "_blank",
      "noopener",
    );
  });

  it("does nothing when the page has no slug to link to", async () => {
    const { handleResultSelection } = useSearchSelection();
    const withoutSlug: ContentSearchResult = { ...contentResult, slug: "" };
    await handleResultSelection(withoutSlug);

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
