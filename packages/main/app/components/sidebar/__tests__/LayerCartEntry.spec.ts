import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import LayerCartEntry from "~/components/sidebar/LayerCartEntry.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { dimensionsStore, layerStore, mapViewStore, panelStore } = vi.hoisted(
  () => ({
    dimensionsStore: {
      clearLayerDimensions: vi.fn(),
      getDimensions: vi.fn(() => ({
        time: {
          availableValues: ["2025", "2026"],
          currentValue: "2026",
        },
      })),
      setDimension: vi.fn(),
    },
    layerStore: {
      backgroundLayer: null,
      getLayer: vi.fn(() => ({ humanId: "dataset-id", type: "dataset" })),
      removeLayer: vi.fn(),
    },
    mapViewStore: {
      mapLayers: [{ uuid: "bottom" }, { uuid: "layer" }, { uuid: "top" }],
      moveLayerDown: vi.fn(),
      moveLayerUp: vi.fn(),
      removeLayer: vi.fn(),
      toggleVisibility: vi.fn(),
      updateLayerOpacity: vi.fn(),
    },
    panelStore: {
      openDatasetPanel: vi.fn(),
    },
  }),
);

mockNuxtImport("useMapViewStore", () => () => mapViewStore);

vi.mock("@swissgeo/dimension", () => ({
  getDisplayNameFromTimestamp: (value: string) => value,
  useDimensionsStore: () => dimensionsStore,
}));

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
}));

vi.mock("@swissgeo/skeleton", () => ({
  useDatasetPanelStore: () => panelStore,
}));

vi.mock("vue-i18n", async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({
    t: (key: string, values?: { name?: string }) =>
      values?.name ? key + ":" + values.name : key,
  }),
}));

const layer = {
  displayName: "Test layer",
  format: "WMTS" as const,
  isVisible: true,
  layerId: "test-layer",
  opacity: 0.75,
  uuid: "layer",
};

const UDropdownMenuStub = {
  name: "UDropdownMenu",
  props: ["items"],
  template: '<div data-testid="reorder-menu"><slot /></div>',
};

const UButtonStub = {
  inheritAttrs: false,
  props: ["icon"],
  template: '<button v-bind="$attrs"><span :data-icon="icon" /></button>',
};

function mountEntry() {
  return mount(LayerCartEntry, {
    props: {
      layer,
      layerIndex: 1,
    },
    global: {
      stubs: {
        UButton: UButtonStub,
        UDropdownMenu: UDropdownMenuStub,
        USelect: true,
        USlider: true,
      },
    },
  });
}

describe("LayerCartEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the compact Figma icon set without generic button surfaces", () => {
    const wrapper = mountEntry();

    expect(
      wrapper
        .findAll("[data-icon]")
        .map((icon) => icon.attributes("data-icon")),
    ).toEqual([
      "i-lucide-grip-vertical",
      "i-lucide-chevron-down",
      "i-lucide-eye-off",
      "i-lucide-info",
      "i-lucide-trash-2",
    ]);
    expect(wrapper.get("article").classes()).toContain("bg-elevated");
    expect(wrapper.get("article").classes()).toContain("gap-1.5");
    expect(wrapper.get("span[title='Test layer']").classes()).toContain(
      "truncate",
    );
    expect(wrapper.find("output").exists()).toBe(false);
  });

  it("collapses the details with the Figma disclosure control", async () => {
    const wrapper = mountEntry();

    await wrapper
      .get('button[aria-label="layerPanel.collapse:Test layer"]')
      .trigger("click");

    expect(wrapper.find("[id^='layer-details-']").exists()).toBe(false);
    expect(wrapper.find('[data-icon="i-lucide-chevron-right"]').exists()).toBe(
      true,
    );
  });

  it("preserves the existing layer commands", async () => {
    const wrapper = mountEntry();

    await wrapper
      .get('button[aria-label="layerPanel.hide:Test layer"]')
      .trigger("click");
    await wrapper
      .get('button[aria-label="layerPanel.information:Test layer"]')
      .trigger("click");
    await wrapper
      .get('button[aria-label="layerPanel.remove:Test layer"]')
      .trigger("click");

    const reorderItems = wrapper
      .getComponent(UDropdownMenuStub)
      .props("items") as { onSelect: () => void }[];
    reorderItems[0]!.onSelect();
    reorderItems[1]!.onSelect();

    expect(mapViewStore.toggleVisibility).toHaveBeenCalledWith(1);
    expect(panelStore.openDatasetPanel).toHaveBeenCalledWith("dataset-id");
    expect(dimensionsStore.clearLayerDimensions).toHaveBeenCalledWith("layer");
    expect(layerStore.removeLayer).toHaveBeenCalledWith("layer");
    expect(mapViewStore.removeLayer).toHaveBeenCalledWith(1);
    expect(mapViewStore.moveLayerUp).toHaveBeenCalledWith(1);
    expect(mapViewStore.moveLayerDown).toHaveBeenCalledWith(1);
  });
});
