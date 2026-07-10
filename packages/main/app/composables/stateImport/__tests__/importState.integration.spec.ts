import type { Layer as MapLayer } from "@swissgeo/map";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useLayerStore } from "@swissgeo/layers";
import { usePositionStore } from "@swissgeo/map";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";

import { importStateFromService } from "@/composables/stateImport/importStateFromService";

import { datasetResponse } from "./fixtures/ogc_dataset";

const { mocks } = await vi.hoisted(async () => {
  const { nuxtMocks } = await import("../../../../tests/mock-nuxt-imports");
  return { mocks: nuxtMocks };
});

const fetchMock = vi.fn();

const route = reactive({
  query: {} as Record<string, unknown>,
});

const replaceMock = vi.fn();
const showWarningMock = vi.fn();
const setStateIdMock = vi.fn();

const mockMapLayers: MapLayer[] = [];

const serviceResponse = {
  state: {
    map: {
      center: [2660000, 1190000],
      zoom: 1,
      rotation: 0,
    },
    layers: [
      {
        layerUrl:
          "https://services.swissgeo.ch/api/oar/v0/collections/swissgeo.catalog/items/test.id.layer?language=de",
        type: "dataset",
        isVisible: true,
        opacity: 0.75,
        dimensions: {
          time: {
            currentValue: "current",
          },
        },
      },
    ],
    bg_layer: {
      layerUrl:
        "https://services.swissgeo.ch/api/oar/v0/collections/swissgeo.catalog/items/test.id.background.layer?language=de",
      type: "dataset",
      isVisible: true,
      opacity: 1,
      dimensions: {
        time: {
          currentValue: "current",
        },
      },
    },
  },
  deprecated: false,
  warning: "",
};

vi.stubGlobal("$fetch", fetchMock);

/* -------------------------------------------------------------------------- */
/*                               Nuxt composables                             */
/* -------------------------------------------------------------------------- */

mockNuxtImport("useRoute", () => () => route);

mockNuxtImport("useRouter", () => () => ({
  replace: replaceMock,
  afterEach: vi.fn(),
}));

mockNuxtImport("onNuxtReady", mocks.onNuxtReady);

mockNuxtImport("useNuxtApp", mocks.useNuxtApp);

mockNuxtImport("useToaster", () => () => ({
  showWarning: showWarningMock,
  showError: vi.fn(),
}));

/* -------------------------------------------------------------------------- */
/*                                    Stores                                  */
/* -------------------------------------------------------------------------- */

mockNuxtImport("useMapViewStore", () => () => ({
  mapLayers: mockMapLayers,

  backgroundLayer: null,

  setStateId: setStateIdMock,

  removeLayer: vi.fn(),

  addLayerToTop: (layer: MapLayer) => {
    mockMapLayers.push(layer);
  },
}));

describe("importStateFromService integration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    route.query = {};

    mockMapLayers.length = 0;

    fetchMock.mockReset();

    replaceMock.mockReset();
    showWarningMock.mockReset();
    setStateIdMock.mockReset();

    sessionStorage.clear();

    const layerStore = useLayerStore();
    layerStore.$reset();
    layerStore.setBackground(null);
  });

  it("restores the state from the service", async () => {
    route.query = {
      state: "test-state-id",
    };

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/wpa/v1/state/test-state-id") {
        return serviceResponse;
      }
      return datasetResponse;
    });

    const restored = await importStateFromService();

    expect(restored).toBe(true);

    const layerStore = useLayerStore();

    expect(layerStore.layers).toHaveLength(1);

    expect(layerStore.backgroundLayer).not.toBeNull();

    const importOptions = layerStore.consumeImportOptions(
      layerStore.layers[0]!.uuid,
    );

    expect(importOptions).toEqual({
      opacity: 0.75,
      isVisible: true,
    });

    expect(layerStore.isThereImportOptions()).toBe(false);

    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);

    expect(stored.state.map.center).toEqual([2660000, 1190000]);
    expect(stored.state.map.zoom).toBe(1);
  });

  it("overrides the zoom level from the URL", async () => {
    route.query = {
      state: "test-state-id",
      z: "7",
    };
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/wpa/v1/state/test-state-id") {
        return serviceResponse;
      }

      return datasetResponse;
    });

    const setZoomSpy = vi.spyOn(usePositionStore(), "setZoom");

    await importStateFromService();

    expect(setZoomSpy).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        name: "state-config",
      }),
    );
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!);

    expect(stored.state.map.center).toEqual([2660000, 1190000]);
    expect(stored.state.map.zoom).toBe(7);
  });
  it("returns false when no state parameter is present", async () => {
    route.query = {};

    const restored = await importStateFromService();

    expect(restored).toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();

    expect(setStateIdMock).not.toHaveBeenCalled();

    expect(showWarningMock).not.toHaveBeenCalled();

    const layerStore = useLayerStore();

    expect(layerStore.layers).toHaveLength(0);
    expect(layerStore.backgroundLayer).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("returns false when the state cannot be retrieved", async () => {
    route.query = {
      state: "missing-state",
    };

    fetchMock.mockRejectedValueOnce(new Error("404"));

    const restored = await importStateFromService();

    expect(restored).toBe(false);

    expect(fetchMock).toHaveBeenCalledWith("/api/wpa/v1/state/missing-state");

    expect(setStateIdMock).not.toHaveBeenCalled();

    expect(showWarningMock).not.toHaveBeenCalled();

    const layerStore = useLayerStore();

    expect(layerStore.layers).toHaveLength(0);
    expect(layerStore.backgroundLayer).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("shows a warning when the returned payload is invalid", async () => {
    route.query = {
      state: "invalid-state",
    };

    fetchMock.mockResolvedValueOnce({
      state: {
        map: {
          center: ["not", "numbers"],
        },
      },
    });

    const restored = await importStateFromService();

    expect(restored).toBe(false);

    expect(setStateIdMock).toHaveBeenCalledWith("invalid-state");

    expect(showWarningMock).toHaveBeenCalledOnce();

    const layerStore = useLayerStore();

    expect(layerStore.layers).toHaveLength(0);
    expect(layerStore.backgroundLayer).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("shows a warning when importing a layer fails", async () => {
    route.query = {
      state: "test-state-id",
    };

    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/wpa/v1/state/test-state-id") {
        return serviceResponse;
      }

      throw new Error("Layer service unavailable");
    });

    const restored = await importStateFromService();

    expect(restored).toBe(false);

    expect(setStateIdMock).toHaveBeenCalledWith("test-state-id");

    expect(showWarningMock).toHaveBeenCalledOnce();

    const layerStore = useLayerStore();

    expect(layerStore.layers).toHaveLength(0);
    expect(layerStore.backgroundLayer).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
