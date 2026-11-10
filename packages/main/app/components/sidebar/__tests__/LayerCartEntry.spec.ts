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
  setSelectedDistributionId: vi.fn(),
  getLayer: vi.fn(
    (): Record<string, unknown> => ({
      type: "dataset",
      humanId: "a-human-id",
      data: { properties: {} },
    }),
  ),
}));
const dimensionsStore = vi.hoisted(() => ({
  getDimensions: vi.fn((): unknown => undefined),
  setDimension: vi.fn(),
  clearLayerDimensions: vi.fn(),
}));
const featureStore = vi.hoisted(() => ({
  clearWmsCapability: vi.fn(),
}));
const { expandedLayers, mapViewStore } = await vi.hoisted(async () => {
  const { reactive } = await import("vue");
  const expandedLayers = reactive<Record<string, boolean>>({});
  return {
    expandedLayers,
    mapViewStore: {
      getLayerLegends: vi.fn(() => []),
      updateLayerOpacity: vi.fn(),
      toggleVisibility: vi.fn(),
      moveLayerUp: vi.fn(),
      moveLayerDown: vi.fn(),
      removeLayer: vi.fn(),
      isLayerExpanded: vi.fn((uuid: string) => expandedLayers[uuid] ?? false),
      setLayerExpanded: vi.fn((uuid: string, expanded: boolean) => {
        expandedLayers[uuid] = expanded;
      }),
    },
  };
});

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
  isDatasetLayer: (layer: { type: string }) => layer.type === "dataset",
}));
vi.mock("@swissgeo/feature", () => ({ useFeaturesStore: () => featureStore }));
vi.mock("@swissgeo/dimension", () => ({
  useDimensionsStore: () => dimensionsStore,
  getDisplayNameFromTimestamp: (time: string) => time,
}));
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);
mockNuxtImport("useMapViewStore", () => () => mapViewStore);

const LayerVariantSelectStub = {
  name: "LayerVariantSelect",
  props: ["dataset", "selectedDistributionId"],
  emits: ["select"],
  template: "<div />",
};

const USelectStub = {
  name: "USelect",
  props: ["modelValue", "items"],
  emits: ["update:modelValue"],
  template: "<div v-bind='$attrs' />",
};

const stubs = {
  LayerLegend: {
    name: "LayerLegend",
    props: ["legends", "detailLink"],
    template: "<div data-testid='legend-stub' />",
  },
  LayerVariantSelect: LayerVariantSelectStub,
  UButton: {
    inheritAttrs: false,
    props: ["to"],
    template:
      "<a v-if='to' :href='to' v-bind='$attrs' /><button v-else v-bind='$attrs' />",
  },
  USlider: { template: "<div />" },
  USelect: USelectStub,
};

const timeDimension = {
  time: { currentValue: "2020", availableValues: ["2020", "2010"] },
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

function layerName(wrapper: ReturnType<typeof mountEntry>) {
  return wrapper
    .findAll("button")
    .find((button) => button.text() === "A layer");
}

describe("LayerCartEntry.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const uuid of Object.keys(expandedLayers)) {
      delete expandedLayers[uuid];
    }
    layerStore.getLayer.mockReturnValue({
      type: "dataset",
      humanId: "a-human-id",
      data: { properties: {} },
    });
    dimensionsStore.getDimensions.mockReturnValue(undefined);
  });

  it("shows the layer name", () => {
    expect(mountEntry().text()).toContain("A layer");
  });

  it("shows the full dataset title as tooltip of the short layer name", () => {
    layerStore.getLayer.mockReturnValue({
      type: "dataset",
      humanId: "a-human-id",
      data: { properties: { title: "A layer with a long title" } },
    });

    const name = layerName(mountEntry());

    expect(name?.attributes("title")).toBe("A layer with a long title");
  });

  it("uses the layer name as tooltip of a layer that comes from no dataset", () => {
    layerStore.getLayer.mockReturnValue({ type: "file", humanId: "whatever" });

    expect(layerName(mountEntry())?.attributes("title")).toBe("A layer");
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

  it("starts expanded when the layer was newly added", () => {
    expandedLayers["a-uuid"] = true;

    const wrapper = mountEntry();

    expect(wrapper.find("[data-testid='legend-stub']").exists()).toBe(true);
    expect(
      wrapper
        .find("[data-testid='layer-expand-toggle']")
        .attributes("aria-expanded"),
    ).toBe("true");
  });

  it("reveals the legend only once expanded", async () => {
    const wrapper = mountEntry();
    expect(wrapper.find("[data-testid='legend-stub']").exists()).toBe(false);

    const toggle = wrapper.find("[data-testid='layer-expand-toggle']");
    await toggle.trigger("click");

    expect(wrapper.find("[data-testid='legend-stub']").exists()).toBe(true);
    // Screen readers link the toggle to the part it opens
    const detailsId = toggle.attributes("aria-controls");
    expect(wrapper.find(`[id='${detailsId}']`).exists()).toBe(true);
  });

  it("reorders the layer with the arrow keys on the handle", async () => {
    const wrapper = mountEntry();
    const handle = wrapper.find("[data-testid='layer-reorder-handle']");

    await handle.trigger("keydown", { key: "ArrowUp" });
    expect(mapViewStore.moveLayerUp).toHaveBeenCalledWith(3);

    await handle.trigger("keydown", { key: "ArrowDown" });
    expect(mapViewStore.moveLayerDown).toHaveBeenCalledWith(3);
  });

  it("marks the reorder handle and the opacity slider, so they do not move the mobile drawer", async () => {
    const wrapper = mountEntry();
    await wrapper.find("[data-testid='layer-expand-toggle']").trigger("click");

    expect(
      wrapper.find("[data-testid='layer-reorder-handle']").attributes(),
    ).toHaveProperty("data-vaul-no-drag");
    expect(wrapper.find("[data-vaul-no-drag]:not(button)").exists()).toBe(true);
  });

  it("clears the source layer state when removing it", async () => {
    const wrapper = mountEntry();

    await wrapper.find("[title='layers.remove']").trigger("click");

    expect(dimensionsStore.clearLayerDimensions).toHaveBeenCalledWith("a-uuid");
    expect(featureStore.clearWmsCapability).toHaveBeenCalledWith("a-uuid");
    expect(layerStore.removeLayer).toHaveBeenCalledWith("a-uuid");
  });

  it("links to the source dataset rather than the renderer layer ID", () => {
    const wrapper = mountEntry();
    expect(wrapper.get("[title='layers.info']").attributes("href")).toBe(
      "/de/dataset/a-human-id",
    );
  });

  it.each`
    type         | detailLink
    ${"dataset"} | ${{ path: "/de/dataset/a-human-id", query: { tab: "legend" } }}
    ${"file"}    | ${undefined}
  `(
    "links the legend of a $type layer to the legend tab: $detailLink",
    async ({ type, detailLink }) => {
      layerStore.getLayer.mockReturnValue({
        type,
        humanId: "a-human-id",
        data: { properties: {} },
      });
      const wrapper = mountEntry();
      await wrapper
        .find("[data-testid='layer-expand-toggle']")
        .trigger("click");

      expect(
        wrapper.getComponent({ name: "LayerLegend" }).props("detailLink"),
      ).toEqual(detailLink);
    },
  );

  it("has nothing to tell about a layer that comes from no dataset", () => {
    layerStore.getLayer.mockReturnValue({ type: "file", humanId: "whatever" });

    expect(mountEntry().find("[title='layers.info']").exists()).toBe(false);
  });

  it.each`
    aggregated   | isShown
    ${true}      | ${true}
    ${undefined} | ${false}
  `(
    "shows the variant select=$isShown for aggregated=$aggregated",
    async ({ aggregated, isShown }) => {
      layerStore.getLayer.mockReturnValue({
        type: "dataset",
        humanId: "a-human-id",
        data: { properties: { aggregated } },
      });
      const wrapper = mountEntry();

      await wrapper
        .find("[data-testid='layer-expand-toggle']")
        .trigger("click");

      expect(wrapper.findComponent(LayerVariantSelectStub).exists()).toBe(
        isShown,
      );
    },
  );

  it.each`
    isExpanded | isShown
    ${true}    | ${true}
    ${false}   | ${false}
  `(
    "shows the time select=$isShown for isExpanded=$isExpanded",
    ({ isExpanded, isShown }) => {
      expandedLayers["a-uuid"] = isExpanded;
      dimensionsStore.getDimensions.mockReturnValue(timeDimension);

      const wrapper = mountEntry();

      expect(wrapper.find("[data-testid='layer-time-select']").exists()).toBe(
        isShown,
      );
      expect(wrapper.find("select").exists()).toBe(false);
    },
  );

  it("shows no time select for a layer with only one time", () => {
    expandedLayers["a-uuid"] = true;
    dimensionsStore.getDimensions.mockReturnValue({
      time: { currentValue: "2020", availableValues: ["2020"] },
    });

    const wrapper = mountEntry();

    expect(wrapper.find("[data-testid='layer-time-select']").exists()).toBe(
      false,
    );
  });

  it("sets the selected time of its own layer", () => {
    expandedLayers["a-uuid"] = true;
    dimensionsStore.getDimensions.mockReturnValue(timeDimension);
    const wrapper = mountEntry();
    const select = wrapper.findComponent(USelectStub);

    expect(select.props()).toEqual({
      modelValue: "2020",
      items: [
        { label: "2020", value: "2020" },
        { label: "2010", value: "2010" },
      ],
    });

    expect(select.attributes("aria-label")).toBe("layers.time");

    select.vm.$emit("update:modelValue", "2010");

    expect(dimensionsStore.setDimension).toHaveBeenCalledWith(
      "a-uuid",
      "time",
      { currentValue: "2010" },
    );
  });

  it("switches the variant and clears the values of the old variant", async () => {
    const data = { properties: { aggregated: true } };
    layerStore.getLayer.mockReturnValue({
      type: "dataset",
      humanId: "a-human-id",
      data,
      selectedDistributionId: "a-dataset:wms",
    });
    const wrapper = mountEntry();
    await wrapper.find("[data-testid='layer-expand-toggle']").trigger("click");
    const select = wrapper.findComponent(LayerVariantSelectStub);

    select.vm.$emit("select", "a-dataset-availability:wms");

    expect(select.props()).toEqual({
      dataset: data,
      selectedDistributionId: "a-dataset:wms",
    });
    expect(dimensionsStore.clearLayerDimensions).toHaveBeenCalledWith("a-uuid");
    expect(featureStore.clearWmsCapability).toHaveBeenCalledWith("a-uuid");
    expect(layerStore.setSelectedDistributionId).toHaveBeenCalledWith(
      "a-uuid",
      "a-dataset-availability:wms",
    );
  });
});
