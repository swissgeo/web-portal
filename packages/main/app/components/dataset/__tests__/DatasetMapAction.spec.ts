import type { Dataset } from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import DatasetMapAction from "~/components/dataset/DatasetMapAction.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const datasetLayer = vi.hoisted(() => ({
  isOnMap: { value: false },
  addToMap: vi.fn(),
  removeFromMap: vi.fn(),
}));

vi.mock("~/composables/useDatasetLayer", () => ({
  useDatasetLayer: () => datasetLayer,
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
  DatasetNotMappableHint: {
    name: "DatasetNotMappableHint",
    props: ["showHint"],
    template: "<slot />",
  },
};

function makeDataset(preferredDistributionId?: string): Dataset {
  return {
    id: "ch.a",
    properties: {
      type: "Dataset",
      title: "Title",
      shortTitle: "Short",
      preferredDistributionId,
    },
    links: [],
  };
}

function mountAction(dataset: Dataset) {
  return mount(DatasetMapAction, { props: { dataset }, global: { stubs } });
}

describe("DatasetMapAction.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    datasetLayer.isOnMap = ref(false);
  });

  it("adds a dataset that the map can show", async () => {
    const wrapper = mountAction(makeDataset("ch.a:wmts"));
    const button = wrapper.get("[data-testid='dataset-add-to-map']");

    expect(button.text()).toBe("dataset.addToMap");
    expect(button.attributes("aria-disabled")).toBeUndefined();
    expect(button.attributes("aria-describedby")).toBeUndefined();

    await button.trigger("click");

    expect(datasetLayer.addToMap).toHaveBeenCalledOnce();
  });

  it("grays out the button of a dataset that the map cannot show", async () => {
    const wrapper = mountAction(makeDataset());
    const button = wrapper.get("[data-testid='dataset-add-to-map']");

    expect(button.attributes("aria-disabled")).toBe("true");
    expect(
      wrapper.get(`#${button.attributes("aria-describedby")}`).text(),
    ).toBe("dataset.notMappable");
    expect(
      wrapper
        .getComponent({ name: "DatasetNotMappableHint" })
        .props("showHint"),
    ).toBe(true);

    await button.trigger("click");

    expect(datasetLayer.addToMap).not.toHaveBeenCalled();
  });

  it("shows no hidden hint next to the remove button of a dataset that the map cannot show", () => {
    datasetLayer.isOnMap = ref(true);
    const wrapper = mountAction(makeDataset());

    expect(wrapper.text()).not.toContain("dataset.notMappable");
  });

  it("removes a dataset that is on the map", async () => {
    datasetLayer.isOnMap = ref(true);
    const wrapper = mountAction(makeDataset("ch.a:wmts"));

    await wrapper.get("button").trigger("click");

    expect(wrapper.get("button").text()).toBe("dataset.removeFromMap");
    expect(datasetLayer.removeFromMap).toHaveBeenCalledOnce();
  });
});
