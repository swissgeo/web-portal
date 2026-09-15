import { mount } from "@vue/test-utils";
import LayerCatalog from "~/components/sidebar/layerCatalog/LayerCatalog.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sidebarStore = vi.hoisted(() => ({ setSidebar: vi.fn() }));

vi.mock("@swissgeo/skeleton", () => ({
  useSidebarStore: () => sidebarStore,
  SidebarType: { LAYER_CART: "layerCart" },
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  LayerCatalogTable: { template: "<div data-testid='table-stub' />" },
  UButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
};

function mountCatalog() {
  return mount(LayerCatalog, { global: { stubs } });
}

describe("LayerCatalog.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the catalog title and the table of all layers", () => {
    const wrapper = mountCatalog();

    expect(wrapper.get("h3").text()).toBe("layerCatalog.title");
    expect(wrapper.find("[data-testid='table-stub']").exists()).toBe(true);
  });

  it("goes back to the layer cart when closed", async () => {
    const wrapper = mountCatalog();

    const close = wrapper.get("button");
    expect(close.text()).toBe("layerCatalog.close");
    await close.trigger("click");

    expect(sidebarStore.setSidebar).toHaveBeenCalledExactlyOnceWith(
      "layerCart",
    );
  });
});
