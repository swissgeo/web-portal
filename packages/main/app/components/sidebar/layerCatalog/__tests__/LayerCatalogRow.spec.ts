import type { Contact, Dataset } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import LayerCatalogRow from "~/components/sidebar/layerCatalog/LayerCatalogRow.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const useDatasetLayerMock = vi.hoisted(() => vi.fn());
const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(false) };
});
mockNuxtImport("useIsDesktop", () => () => isDesktop);
const datasetLayer = {
  isOnMap: ref(false),
  addToMap: vi.fn(),
  removeFromMap: vi.fn(),
};

vi.mock("~/composables/useDatasetLayer", () => ({
  useDatasetLayer: useDatasetLayerMock,
}));
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  USwitch: {
    inheritAttrs: false,
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template: `<button role="switch" v-bind="$attrs" :aria-checked="String(modelValue)" @click="$emit('update:modelValue', !modelValue)" />`,
  },
  ULink: {
    inheritAttrs: false,
    props: ["to", "as"],
    template:
      "<a v-if='to' :href='to' v-bind='$attrs'><slot /></a><component :is='as' v-else v-bind='$attrs'><slot /></component>",
  },
  UButton: {
    inheritAttrs: false,
    props: ["to"],
    template: "<a :href='to' v-bind='$attrs' />",
  },
  UBadge: {
    props: ["label"],
    template: "<span>{{ label }}</span>",
  },
};

function makeDataset(id = "ch.a", contacts?: Contact[]): Dataset {
  return {
    id,
    properties: { type: "Dataset", title: `Title of ${id}`, contacts },
    links: [],
  };
}

function mountRow(dataset = makeDataset()) {
  return mount(LayerCatalogRow, {
    props: { dataset },
    global: { stubs },
  });
}

function cells(wrapper: ReturnType<typeof mountRow>) {
  return wrapper.findAll("[role='cell']");
}

function dataOwnerCell(wrapper: ReturnType<typeof mountRow>) {
  return cells(wrapper)[1]!;
}

// On mobile, the data owner is shown below the title instead of in its own column
function mobileDataOwner(wrapper: ReturnType<typeof mountRow>) {
  return wrapper.find("[data-testid='catalog-layer-provider']");
}

describe("LayerCatalogRow.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDatasetLayerMock.mockReturnValue(datasetLayer);
    datasetLayer.isOnMap.value = false;
    isDesktop.value = false;
  });

  it("shows the layer title next to the switch, in one column", () => {
    const wrapper = mountRow();
    const cell = cells(wrapper)[0]!;

    expect(wrapper.attributes("role")).toBe("row");
    expect(cells(wrapper)).toHaveLength(3);
    expect(cell.find("[data-testid='catalog-layer-on-map']").exists()).toBe(
      true,
    );
    expect(
      cell.get("[data-testid='catalog-layer-on-map']").attributes("aria-label"),
    ).toBe("Title of ch.a");
    expect(cell.get("[data-testid='catalog-layer-title']").text()).toBe(
      "Title of ch.a",
    );
    expect(cell.attributes("title")).toBe("Title of ch.a");
  });

  it("shows the short title, with the full title as tooltip", () => {
    const dataset = makeDataset();
    dataset.properties.shortTitle = "Short of ch.a";
    const cell = cells(mountRow(dataset))[0]!;

    expect(cell.get("[data-testid='catalog-layer-title']").text()).toBe(
      "Short of ch.a",
    );
    expect(
      cell.get("[data-testid='catalog-layer-on-map']").attributes("aria-label"),
    ).toBe("Short of ch.a");
    expect(cell.attributes("title")).toBe("Title of ch.a");
  });

  it("shows the resource provider as data owner, wherever it is listed", () => {
    const wrapper = mountRow(
      makeDataset("ch.a", [
        { role: "pointOfContact", organization: "Contact AG" },
        { role: "resourceProvider", organization: "swisstopo" },
      ]),
    );
    const cell = dataOwnerCell(wrapper);

    expect(cell.text()).toBe("swisstopo");
    expect(mobileDataOwner(wrapper).text()).toBe("swisstopo");
    expect(cell.attributes("title")).toBe("resourceProvider: swisstopo");
  });

  it("falls back to the first contact without a resource provider", () => {
    const cell = dataOwnerCell(
      mountRow(
        makeDataset("ch.a", [
          { role: "owner", organization: "BAFU" },
          { role: "distributor", organization: "Other AG" },
        ]),
      ),
    );

    expect(cell.text()).toBe("BAFU");
    expect(cell.attributes("title")).toBe("owner: BAFU");
  });

  it("shows only the organization in the tooltip of a contact without role", () => {
    const cell = dataOwnerCell(
      mountRow(makeDataset("ch.a", [{ organization: "BAFU" }])),
    );

    expect(cell.text()).toBe("BAFU");
    expect(cell.attributes("title")).toBe("BAFU");
  });

  it("hides the data owner column on mobile", () => {
    const cell = dataOwnerCell(
      mountRow(makeDataset("ch.a", [{ role: "owner", organization: "BAFU" }])),
    );

    expect(cell.classes()).toEqual(
      expect.arrayContaining(["hidden", "md:block"]),
    );
  });

  it("leaves the data owner empty without contacts", () => {
    const wrapper = mountRow();
    const cell = dataOwnerCell(wrapper);

    expect(mobileDataOwner(wrapper).exists()).toBe(false);
    expect(cell.text()).toBe("");
    expect(cell.attributes("title")).toBeUndefined();
  });

  it("adds the layer to the map when switched on", async () => {
    const wrapper = mountRow();
    const toggle = wrapper.get("[data-testid='catalog-layer-on-map']");

    expect(toggle.attributes("aria-checked")).toBe("false");
    expect(wrapper.classes()).toContain("text-toned");

    await toggle.trigger("click");

    expect(datasetLayer.addToMap).toHaveBeenCalledOnce();
    expect(datasetLayer.removeFromMap).not.toHaveBeenCalled();
  });

  it("removes the layer from the map when switched off", async () => {
    datasetLayer.isOnMap.value = true;
    const wrapper = mountRow();
    const toggle = wrapper.get("[data-testid='catalog-layer-on-map']");

    expect(toggle.attributes("aria-checked")).toBe("true");
    expect(wrapper.classes()).toContain("text-highlighted");

    await toggle.trigger("click");

    expect(datasetLayer.removeFromMap).toHaveBeenCalledOnce();
    expect(datasetLayer.addToMap).not.toHaveBeenCalled();
  });

  it("puts the dataset it currently shows on the map", async () => {
    const wrapper = mountRow(makeDataset("ch.a"));
    const currentDataset = useDatasetLayerMock.mock.calls[0]![0];
    expect(currentDataset()).toEqual(makeDataset("ch.a"));

    await wrapper.setProps({ dataset: makeDataset("ch.b") });

    expect(currentDataset()).toEqual(makeDataset("ch.b"));
  });

  it("links to the localized dataset URL and follows dataset changes", async () => {
    const wrapper = mountRow();
    const info = () => wrapper.get("[data-testid='catalog-layer-info']");
    expect(info().attributes("href")).toBe("/de/dataset/ch.a");
    await wrapper.setProps({ dataset: makeDataset("ch.b") });
    expect(info().attributes("href")).toBe("/de/dataset/ch.b");
    expect(datasetLayer.addToMap).not.toHaveBeenCalled();
  });

  it("opens the detail view with the title on mobile, not on desktop", async () => {
    const wrapper = mountRow();
    const title = () => wrapper.get("[data-testid='catalog-layer-title']");
    expect(title().attributes("href")).toBe("/de/dataset/ch.a");

    isDesktop.value = true;
    await wrapper.vm.$nextTick();
    expect(title().element.tagName).toBe("DIV");
    expect(title().attributes("href")).toBeUndefined();
  });

  it.each`
    aggregated   | isShown
    ${true}      | ${true}
    ${undefined} | ${false}
  `(
    "shows the aggregated tag=$isShown for aggregated=$aggregated",
    ({ aggregated, isShown }) => {
      const dataset = makeDataset();
      dataset.properties.aggregated = aggregated;
      const wrapper = mountRow(dataset);
      const tag = wrapper.find("[data-testid='catalog-layer-aggregated']");

      expect(tag.exists()).toBe(isShown);
      if (isShown) {
        expect(tag.text()).toBe("dataset.aggregated");
      }
    },
  );
});
