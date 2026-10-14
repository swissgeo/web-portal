import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import BackgroundSelector from "@/components/sidebar/backgroundSelector/BackgroundSelector.vue";

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({ backgroundLayer: null, setBackground: vi.fn() }),
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

describe("BackgroundSelector.vue", () => {
  it("opens the tile list above the whole selector box", async () => {
    const wrapper = mount(BackgroundSelector, {
      global: {
        stubs: {
          UFormField: { template: "<div><slot /></div>" },
          UPopover: {
            name: "UPopover",
            props: ["reference", "content"],
            template: "<div />",
          },
        },
      },
    });
    // The box ref is set after the first render
    await nextTick();
    const popover = wrapper.getComponent({ name: "UPopover" });

    expect(popover.props("content")).toEqual({ side: "top" });
    expect(popover.props("reference")).toBe(wrapper.element);
  });
});
