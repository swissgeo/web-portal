import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import BackgroundSelector from "@/components/sidebar/backgroundSelector/BackgroundSelector.vue";

const layerStore = vi.hoisted(() => ({
  backgroundLayer: null,
  setBackground: vi.fn(),
}));
vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => layerStore,
  makeServerLayer: vi.fn(),
}));
mockNuxtImport("useI18n", () => () => ({
  locale: { value: "en" },
  t: (key: string) => key,
}));
mockNuxtImport(
  "useCatalogItemsUrl",
  () => () => (id: string) => `https://catalog.test/${id}`,
);
// The test only checks the layout, so the background requests never answer
vi.stubGlobal("fetch", () => new Promise(() => {}));

function mountSelector() {
  return mount(BackgroundSelector, {
    global: {
      stubs: {
        UFormField: { template: "<div><slot /></div>" },
        UPopover: {
          name: "UPopover",
          props: ["reference", "content"],
          template: "<div><slot :open='false' /><slot name='content' /></div>",
        },
        UButton: {
          props: ["label"],
          template: "<button>{{ label }}</button>",
        },
        BackgroundSelectorEntry: {
          name: "BackgroundSelectorEntry",
          props: ["backgroundLayer", "isCurrent"],
          emits: ["click"],
          template: "<button data-testid='tile' @click=\"$emit('click')\" />",
        },
      },
    },
  });
}

describe("BackgroundSelector.vue", () => {
  it("opens the tile list above the whole selector box", async () => {
    const wrapper = mountSelector();
    // The box ref is set after the first render
    await nextTick();
    const popover = wrapper.getComponent({ name: "UPopover" });

    expect(popover.props("content")).toEqual({ side: "top" });
    expect(popover.props("reference")).toBe(wrapper.element);
  });

  it("picks the background of a tile", async () => {
    const wrapper = mountSelector();

    // Until the backgrounds load, only the void background is offered
    await wrapper.get("[data-testid='tile']").trigger("click");

    expect(layerStore.setBackground).toHaveBeenCalledWith(null);
  });
});
