import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import LayerCatalog from "~/components/sidebar/layerCatalog/LayerCatalog.vue";
import {
  panelScrollerKey,
  usePanelScroller,
} from "~/composables/usePanelScroller";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, provide, shallowRef } from "vue";

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);

let tableScroller: ReturnType<typeof usePanelScroller> | undefined;
const LayerCatalogTable = defineComponent({
  setup() {
    tableScroller = usePanelScroller();
    return () => h("div", { "data-testid": "table-stub" });
  },
});

const panelElement = document.createElement("div");

function mountCatalog() {
  // Stands in for the ResponsivePanel the catalog is shown in
  const Panel = defineComponent({
    setup() {
      provide(panelScrollerKey, shallowRef(panelElement));
      return () => h(LayerCatalog);
    },
  });
  return mount(Panel, { global: { stubs: { LayerCatalogTable } } });
}

describe("LayerCatalog.vue", () => {
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    tableScroller = undefined;
    isDesktop.value = true;
  });

  it("shows the table of all layers", () => {
    const wrapper = mountCatalog();

    expect(wrapper.find("[data-testid='table-stub']").exists()).toBe(true);
  });

  it("on desktop, loads more layers when scrolling its own table column", () => {
    const wrapper = mountCatalog();
    const tableColumn = wrapper.get("[data-testid='table-stub']").element
      .parentElement;

    expect(tableScroller!.value).toBe(tableColumn);
  });

  it("on mobile, loads more layers when scrolling the whole panel", () => {
    isDesktop.value = false;

    mountCatalog();

    expect(tableScroller!.value).toBe(panelElement);
  });

  it("switches scroller when the viewport crosses the desktop breakpoint", async () => {
    const wrapper = mountCatalog();
    const tableColumn = wrapper.get("[data-testid='table-stub']").element
      .parentElement;

    isDesktop.value = false;
    await nextTick();
    expect(tableScroller!.value).toBe(panelElement);

    isDesktop.value = true;
    await nextTick();
    expect(tableScroller!.value).toBe(tableColumn);
  });
});
