import type { Dataset } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive, ref } from "vue";

import DatasetPanel from "../DatasetPanel.vue";

const mocks = vi.hoisted(() => ({
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  clearLayerDimensions: vi.fn(),
  makeServerLayer: vi.fn(),
  toast: vi.fn(),
  logError: vi.fn(),
}));
const layers = reactive<{ humanId: string; uuid?: string }[]>([]);
vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({
    layers,
    addLayer: mocks.addLayer,
    removeLayer: mocks.removeLayer,
  }),
  makeServerLayer: mocks.makeServerLayer,
}));
vi.mock("@swissgeo/dimension", () => ({
  useDimensionsStore: () => ({
    clearLayerDimensions: mocks.clearLayerDimensions,
  }),
}));
vi.mock("@swissgeo/log", () => ({ default: { error: mocks.logError } }));
mockNuxtImport("useToaster", () => () => ({ add: mocks.toast }));
mockNuxtImport("useI18n", () => () => ({
  t: (key: string) => key,
  locale: ref("de"),
}));

const dataset: Dataset = {
  id: "example.dataset",
  properties: {
    type: "Dataset",
    title: "Example dataset",
    languages: [{ code: "de", name: "German", dir: "ltr" }],
  },
};

function render(
  overrides: Partial<InstanceType<typeof DatasetPanel>["$props"]> = {},
) {
  return mount(DatasetPanel, {
    props: {
      dataset,
      distributionCollection: null,
      detailUrl: "https://example.com/de/dataset/example.dataset",
      isLoading: false,
      ...overrides,
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        UButton: { template: "<button><slot /></button>" },
        UIcon: true,
        UBadge: { template: "<span><slot /></span>" },
        DatasetDetail: {
          props: ["dataset", "distributionCollection"],
          template: "<div />",
        },
        DatasetCopyLink: true,
      },
    },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  layers.splice(0);
  mocks.makeServerLayer.mockReturnValue({ humanId: dataset.id });
});

describe("DatasetPanel", () => {
  it("adds the displayed dataset and reflects its presence on the map", async () => {
    const wrapper = render();
    await wrapper
      .get('[data-testid="dataset-map-action"] button')
      .trigger("click");
    expect(mocks.makeServerLayer).toHaveBeenCalledWith(dataset);
    expect(mocks.addLayer).toHaveBeenCalledWith({ humanId: dataset.id });

    layers.push({ humanId: dataset.id });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.get('[data-testid="dataset-map-action"] button').text(),
    ).toBe("dataset.removeFromMap");
  });

  it("removes the displayed dataset and clears its dimensions", async () => {
    layers.push({ humanId: dataset.id, uuid: "dataset-layer" });
    const wrapper = render();
    const button = wrapper.get('[data-testid="dataset-map-action"] button');
    expect(button.text()).toBe("dataset.removeFromMap");
    await button.trigger("click");
    expect(mocks.clearLayerDimensions).toHaveBeenCalledWith("dataset-layer");
    expect(mocks.removeLayer).toHaveBeenCalledWith("dataset-layer");
    expect(mocks.addLayer).not.toHaveBeenCalled();
    layers.splice(0);
    await wrapper.vm.$nextTick();
    expect(
      wrapper.get('[data-testid="dataset-map-action"] button').text(),
    ).toBe("dataset.addToMap");
  });

  it("updates the action when a different dataset opens", async () => {
    layers.push({ humanId: dataset.id });
    const wrapper = render();
    await wrapper.setProps({ dataset: { ...dataset, id: "another.dataset" } });
    expect(
      wrapper.get('[data-testid="dataset-map-action"] button').text(),
    ).toBe("dataset.addToMap");
  });

  it("reports a layer creation failure", async () => {
    mocks.makeServerLayer.mockImplementation(() => {
      throw new Error("Unsupported dataset");
    });
    const wrapper = render();
    await wrapper
      .get('[data-testid="dataset-map-action"] button')
      .trigger("click");
    expect(mocks.addLayer).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith({
      color: "error",
      title: "dataset.addToMapError",
    });
  });

  it("reports a layer store failure", async () => {
    mocks.addLayer.mockImplementation(() => {
      throw new Error("Store unavailable");
    });
    const wrapper = render();
    await wrapper
      .get('[data-testid="dataset-map-action"] button')
      .trigger("click");
    expect(mocks.logError).toHaveBeenCalledWith(
      "Failed to add catalog layer to map",
      new Error("Store unavailable"),
    );
    expect(mocks.toast).toHaveBeenCalledOnce();
  });

  it.each([false, true])(
    "emits Back and Close with catalog origin %s",
    async (backToCatalog) => {
      const wrapper = render({ backToCatalog });
      const back = wrapper.get("header button");
      expect(back.text()).toBe(
        backToCatalog ? "dataset.backToCatalog" : "dataset.backToMap",
      );
      await back.trigger("click");
      await wrapper.get('[aria-label="dataset.close"]').trigger("click");
      expect(wrapper.emitted("back")).toHaveLength(1);
      expect(wrapper.emitted("close")).toHaveLength(1);
    },
  );

  it("omits languages and the map action while no dataset is available", () => {
    const wrapper = render({ dataset: null, isLoading: true });
    expect(
      wrapper.find('[data-testid="dataset-map-action"] button').exists(),
    ).toBe(false);
    expect(wrapper.text()).not.toContain("dataset.languages");
    expect(wrapper.findComponent({ name: "DatasetDetail" }).exists()).toBe(
      false,
    );
  });

  it("shows the request error when loading fails", () => {
    const wrapper = render({
      dataset: null,
      error: { message: "Dataset unavailable" },
    });
    expect(wrapper.text()).toContain("Dataset unavailable");
    expect(
      wrapper.find('[data-testid="dataset-map-action"] button').exists(),
    ).toBe(false);
  });

  it("shows supplied languages and removes the section when they are absent", async () => {
    const wrapper = render();
    expect(wrapper.text()).toContain("dataset.languages");
    expect(wrapper.text()).toContain("Deutsch");
    await wrapper.setProps({
      dataset: {
        ...dataset,
        properties: { ...dataset.properties, languages: [] },
      },
    });
    expect(wrapper.text()).not.toContain("dataset.languages");
    expect(wrapper.text()).not.toContain("Deutsch");
  });
});
