import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import LayerCatalog from "~/components/sidebar/layerCatalog/LayerCatalog.vue";
import LayerCatalogTree from "~/components/sidebar/layerCatalog/LayerCatalogTree.vue";
import LayerCatalogTreeMobile from "~/components/sidebar/layerCatalog/LayerCatalogTreeMobile.vue";
import {
  panelScrollerKey,
  usePanelScroller,
} from "~/composables/usePanelScroller";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, provide, shallowRef } from "vue";

const { isDesktop, thesaurusStatus } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true), thesaurusStatus: ref("success") };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);
mockNuxtImport("useThesaurus", () => () => ({
  concepts: shallowRef([
    {
      id: "planning",
      label: "Planung",
      children: [{ id: "zoning", label: "Nutzungsplanung" }],
    },
  ]),
  status: thesaurusStatus,
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

let tableScroller: ReturnType<typeof usePanelScroller> | undefined;
const LayerCatalogTable = defineComponent({
  props: ["conceptIds"],
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
  return mount(Panel, {
    global: {
      stubs: {
        LayerCatalogTable,
        LayerCatalogTree: true,
        LayerCatalogTreeMobile: true,
        LayerCatalogBreadcrumb: true,
        UButton: { template: "<button><slot /></button>" },
      },
    },
  });
}

describe("LayerCatalog.vue", () => {
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    tableScroller = undefined;
    isDesktop.value = true;
    thesaurusStatus.value = "success";
  });

  function tableConceptIds(wrapper: ReturnType<typeof mountCatalog>) {
    return wrapper.getComponent(LayerCatalogTable).props("conceptIds");
  }

  it("filters the table by the concept selected in the tree and the concepts below it", async () => {
    const wrapper = mountCatalog();
    expect(tableConceptIds(wrapper)).toEqual([]);

    wrapper
      .getComponent(LayerCatalogTree)
      .vm.$emit("update:conceptId", "planning");
    await nextTick();
    expect(tableConceptIds(wrapper)).toEqual(["planning", "zoning"]);

    wrapper
      .getComponent(LayerCatalogTree)
      .vm.$emit("update:conceptId", "zoning");
    await nextTick();
    expect(tableConceptIds(wrapper)).toEqual(["zoning"]);
  });

  it("keeps filtering the table while the concepts are reloaded", async () => {
    const wrapper = mountCatalog();
    wrapper
      .getComponent(LayerCatalogTree)
      .vm.$emit("update:conceptId", "planning");
    await nextTick();

    thesaurusStatus.value = "pending";
    await nextTick();

    expect(tableConceptIds(wrapper)).toEqual(["planning", "zoning"]);
  });

  it("on desktop, shows the tree next to the table", () => {
    const wrapper = mountCatalog();

    expect(wrapper.findComponent(LayerCatalogTree).exists()).toBe(true);
    expect(wrapper.findComponent(LayerCatalogTreeMobile).exists()).toBe(false);
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("on mobile, shows the table with a button naming the selected concept", () => {
    isDesktop.value = false;

    const wrapper = mountCatalog();

    expect(wrapper.findComponent(LayerCatalogTree).exists()).toBe(false);
    expect(wrapper.findComponent(LayerCatalogTreeMobile).exists()).toBe(false);
    expect(wrapper.find("[data-testid='table-stub']").exists()).toBe(true);
    expect(wrapper.get("button").text()).toBe("layerCatalog.allLayers");
  });

  it("on mobile, hides the button while the concepts are loading", () => {
    isDesktop.value = false;
    thesaurusStatus.value = "pending";

    const wrapper = mountCatalog();

    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("on mobile, switches from the table to the tree and back", async () => {
    isDesktop.value = false;
    const wrapper = mountCatalog();

    await wrapper.get("button").trigger("click");
    expect(wrapper.findComponent(LayerCatalogTreeMobile).exists()).toBe(true);
    expect(wrapper.find("[data-testid='table-stub']").exists()).toBe(false);

    const tree = wrapper.getComponent(LayerCatalogTreeMobile);
    tree.vm.$emit("update:conceptId", "planning");
    tree.vm.$emit("close");
    await nextTick();

    expect(wrapper.findComponent(LayerCatalogTreeMobile).exists()).toBe(false);
    expect(tableConceptIds(wrapper)).toEqual(["planning", "zoning"]);
    expect(wrapper.get("button").text()).toBe("Planung");
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
