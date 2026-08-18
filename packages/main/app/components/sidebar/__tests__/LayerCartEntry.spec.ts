import type { Layer as MapLayer } from "@swissgeo/map";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LayerCartEntry from "@/components/sidebar/LayerCartEntry.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const layerStore = vi.hoisted(() => ({
  removeLayer: vi.fn(),
  getLayer: vi.fn(() => ({ type: "dataset", humanId: "a-human-id" })),
}));
const dimensionsStore = vi.hoisted(() => ({
  getDimensions: vi.fn(() => undefined),
  setDimension: vi.fn(),
  clearLayerDimensions: vi.fn(),
}));
const datasetPanelStore = vi.hoisted(() => ({ openDatasetPanel: vi.fn() }));
const mapViewStore = vi.hoisted(() => ({
  getLayerLegends: vi.fn(() => []),
  updateLayerOpacity: vi.fn(),
  toggleVisibility: vi.fn(),
  moveLayerUp: vi.fn(),
  moveLayerDown: vi.fn(),
  removeLayer: vi.fn(),
}));

vi.mock("@swissgeo/layers", () => ({ useLayerStore: () => layerStore }));
vi.mock("@swissgeo/dimension", () => ({
  useDimensionsStore: () => dimensionsStore,
  getDisplayNameFromTimestamp: (time: string) => time,
}));
vi.mock("@swissgeo/skeleton", () => ({
  useDatasetPanelStore: () => datasetPanelStore,
  IconButton: {
    name: "IconButton",
    inheritAttrs: false,
    template: "<button v-bind='$attrs' />",
  },
}));
mockNuxtImport("useMapViewStore", () => () => mapViewStore);

const stubs = {
  LayerLegend: { template: "<div data-testid='legend-stub' />" },
  USlider: { template: "<div />" },
};

function makeLayer(overrides: Partial<MapLayer> = {}): MapLayer {
  return {
    format: "WMTS",
    layerId: "a-layer",
    uuid: "a-uuid",
    opacity: 1,
    isVisible: true,
    displayName: "A layer",
    ...overrides,
  } as MapLayer;
}

function mountEntry(layer = makeLayer(), layerIndex = 3) {
  return mount(LayerCartEntry, {
    props: { layer, layerIndex },
    global: { stubs },
  });
}

describe("LayerCartEntry.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    layerStore.getLayer.mockReturnValue({
      type: "dataset",
      humanId: "a-human-id",
    });
  });

  it("shows the layer name", () => {
    expect(mountEntry().text()).toContain("A layer");
  });

  it("toggles the visibility of its own layer", async () => {
    const wrapper = mountEntry();

    await wrapper.find("[title='layers.hide']").trigger("click");

    expect(mapViewStore.toggleVisibility).toHaveBeenCalledWith(3);
  });

  it("offers to show the layer again once it is hidden", () => {
    const wrapper = mountEntry(makeLayer({ isVisible: false }));

    expect(wrapper.find("[title='layers.show']").exists()).toBe(true);
  });

  it("reveals the legend only once expanded", async () => {
    const wrapper = mountEntry();
    expect(wrapper.find("[data-testid='legend-stub']").exists()).toBe(false);

    await wrapper.find("[data-testid='layer-expand-toggle']").trigger("click");

    expect(wrapper.find("[data-testid='legend-stub']").exists()).toBe(true);
  });

  it("reorders the layer with the arrow keys on the handle", async () => {
    const wrapper = mountEntry();
    const handle = wrapper.find("[data-testid='layer-reorder-handle']");

    await handle.trigger("keydown", { key: "ArrowUp" });
    expect(mapViewStore.moveLayerUp).toHaveBeenCalledWith(3);

    await handle.trigger("keydown", { key: "ArrowDown" });
    expect(mapViewStore.moveLayerDown).toHaveBeenCalledWith(3);
  });

  it("clears the layer everywhere when removing it", async () => {
    const wrapper = mountEntry();

    await wrapper.find("[title='layers.remove']").trigger("click");

    expect(dimensionsStore.clearLayerDimensions).toHaveBeenCalledWith("a-uuid");
    expect(layerStore.removeLayer).toHaveBeenCalledWith("a-uuid");
    expect(mapViewStore.removeLayer).toHaveBeenCalledWith(3);
  });

  it("opens the dataset panel of the layer", async () => {
    const wrapper = mountEntry();

    await wrapper.find("[title='layers.info']").trigger("click");

    expect(datasetPanelStore.openDatasetPanel).toHaveBeenCalledWith(
      "a-human-id",
    );
  });

  it("has nothing to tell about a layer that comes from no dataset", () => {
    layerStore.getLayer.mockReturnValue({ type: "file", humanId: "whatever" });

    expect(mountEntry().find("[title='layers.info']").exists()).toBe(false);
  });
});
