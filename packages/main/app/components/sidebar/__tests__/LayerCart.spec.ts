import { mount } from "@vue/test-utils";
import LayerCart from "~/components/sidebar/LayerCart.vue";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const colorBackground = {
  data: {
    id: "ch.swisstopo.pixelkarte-farbe",
    properties: {
      title: "Color map",
      type: "Dataset" as const,
    },
  },
  humanId: "ch.swisstopo.pixelkarte-farbe",
  isLoading: false,
  type: "dataset" as const,
  uuid: "color-background",
};

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({
    backgroundLayer: null,
  }),
}));

vi.mock("vue-i18n", async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({
    t: (key: string) =>
      key === "menu.map"
        ? "Karte"
        : key === "layerPanel.background"
          ? "Hintergrund"
          : key,
  }),
}));

const USelectStub = {
  name: "USelect",
  props: ["items", "modelValue"],
  emits: ["update:modelValue"],
  template: "<button data-testid='background-select'></button>",
};

describe("LayerCart", () => {
  it("renders the Figma panel title and accessible layer-list region", () => {
    const wrapper = mount(LayerCart, {
      props: {
        mapLayers: ref([]),
      },
      global: {
        stubs: {
          LayerCartEntry: true,
          USeparator: true,
        },
      },
    });

    expect(wrapper.get("h2").text()).toBe("Karte");
    expect(wrapper.get("section").attributes("aria-labelledby")).toBe(
      "layer-cart-title",
    );
    expect(wrapper.find('[data-testid="layer-cart"]').exists()).toBe(true);
  });

  it("renders the Figma background field and selects the void map", async () => {
    const wrapper = mount(LayerCart, {
      props: {
        mapLayers: ref([]),
        backgroundLayers: [null, colorBackground],
        currentBackground: colorBackground,
      },
      global: {
        stubs: {
          LayerCartEntry: true,
          USelect: USelectStub,
        },
      },
    });

    expect(wrapper.get("footer label").text()).toBe("Hintergrund");
    expect(wrapper.getComponent(USelectStub).props("modelValue")).toBe(
      "color-background",
    );

    wrapper.getComponent(USelectStub).vm.$emit("update:modelValue", "void");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("setBackground")).toEqual([[null]]);
  });
});
