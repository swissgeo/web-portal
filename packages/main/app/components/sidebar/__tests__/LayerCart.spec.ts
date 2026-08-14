import { mount } from "@vue/test-utils";
import LayerCart from "~/components/sidebar/LayerCart.vue";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({
    backgroundLayer: null,
  }),
}));

vi.mock("vue-i18n", async (importOriginal) => ({
  ...(await importOriginal()),
  useI18n: () => ({
    t: (key: string) => (key === "menu.map" ? "Karte" : key),
  }),
}));

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
});
