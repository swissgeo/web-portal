import type { Layer as MapLayer } from "@swissgeo/map";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import LayerCart from "@/components/sidebar/LayerCart.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const layerStore = vi.hoisted(() => ({
  backgroundLayer: null as { uuid: string } | null,
}));
const mapViewStore = vi.hoisted(() => ({ setLayerIndex: vi.fn() }));
// Captures the options LayerCart hands to useSortable, so the drop handling can
// be exercised without a real drag
const sortableOptions = vi.hoisted(
  () => ({}) as { onUpdate?: (_event: Record<string, number>) => void },
);

vi.mock("@swissgeo/layers", () => ({ useLayerStore: () => layerStore }));
vi.mock("@vueuse/integrations/useSortable", () => ({
  useSortable: (_el: unknown, _list: unknown, options: object) => {
    Object.assign(sortableOptions, options);
    return { start: vi.fn(), stop: vi.fn(), option: vi.fn() };
  },
}));
mockNuxtImport("useMapViewStore", () => () => mapViewStore);

const stubs = {
  LayerCartEntry: {
    props: ["layer", "layerIndex"],
    template: "<li :data-uuid='layer.uuid' :data-index='layerIndex' />",
  },
  UButton: { inheritAttrs: false, template: "<button v-bind='$attrs' />" },
  UModal: {
    props: ["open"],
    template: "<div v-if='open'><slot name='body' /></div>",
  },
};

function makeLayer(uuid: string): MapLayer {
  return {
    format: "WMTS",
    layerId: uuid,
    uuid,
    opacity: 1,
    isVisible: true,
  } as MapLayer;
}

/** The store keeps the layers bottom to top, so "c" is the topmost one here */
function mountCart(uuids = ["a", "b", "c"]) {
  return mount(LayerCart, {
    props: { mapLayers: ref(uuids.map(makeLayer)) },
    global: { stubs },
  });
}

function renderedEntries(wrapper: ReturnType<typeof mountCart>) {
  return wrapper.findAll("li").map((entry) => ({
    uuid: entry.attributes("data-uuid"),
    layerIndex: Number(entry.attributes("data-index")),
  }));
}

describe("LayerCart.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    layerStore.backgroundLayer = null;
  });

  it("lists the topmost layer first, with the index it has in the store", () => {
    expect(renderedEntries(mountCart())).toEqual([
      { uuid: "c", layerIndex: 2 },
      { uuid: "b", layerIndex: 1 },
      { uuid: "a", layerIndex: 0 },
    ]);
  });

  it("leaves the background layer out of the list", () => {
    layerStore.backgroundLayer = { uuid: "bg" };

    expect(renderedEntries(mountCart(["bg", "a", "b"]))).toEqual([
      { uuid: "b", layerIndex: 2 },
      { uuid: "a", layerIndex: 1 },
    ]);
  });

  it("moves the dropped layer to the store index of its new neighbour", () => {
    mountCart();

    // topmost entry dragged down onto the bottom one
    sortableOptions.onUpdate?.({ oldIndex: 0, newIndex: 2 });

    expect(mapViewStore.setLayerIndex).toHaveBeenCalledWith("c", 0);
  });

  it("moves a layer dropped upwards as well", () => {
    mountCart();

    sortableOptions.onUpdate?.({ oldIndex: 2, newIndex: 0 });

    expect(mapViewStore.setLayerIndex).toHaveBeenCalledWith("a", 2);
  });

  it("accounts for the background layer when dropping", () => {
    layerStore.backgroundLayer = { uuid: "bg" };
    mountCart(["bg", "a", "b"]);

    sortableOptions.onUpdate?.({ oldIndex: 0, newIndex: 1 });

    expect(mapViewStore.setLayerIndex).toHaveBeenCalledWith("b", 1);
  });

  it("tells the user that adding a layer is not possible yet", async () => {
    const wrapper = mountCart();
    expect(wrapper.text()).not.toContain("menu.addLayerComingSoon");

    await wrapper.find("[data-testid='add-layer']").trigger("click");

    expect(wrapper.text()).toContain("menu.addLayerComingSoon");
  });

  it("ignores a drop that reports no position", () => {
    mountCart();

    sortableOptions.onUpdate?.({});

    expect(mapViewStore.setLayerIndex).not.toHaveBeenCalled();
  });
});
