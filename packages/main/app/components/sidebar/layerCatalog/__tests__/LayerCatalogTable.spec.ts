import type { Dataset, DatasetCollection, Owner } from "@swissgeo/ogc";
import type { OgcCatalogState } from "~/composables/useOgcCatalog";
import type { Ref } from "vue";

import { mount } from "@vue/test-utils";
import { useInfiniteScroll } from "@vueuse/core";
import LayerCatalogTable from "~/components/sidebar/layerCatalog/LayerCatalogTable.vue";
import { panelScrollerKey } from "~/composables/usePanelScroller";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRef, nextTick, shallowRef, unref } from "vue";

const { catalog, locale, organizations, useOgcCatalogMock } = await vi.hoisted(
  async () => {
    const { ref } = await import("vue");
    const catalog = {
      state: ref<OgcCatalogState>({ status: "pending" }),
      hasMore: ref(false),
      loadMore: vi.fn(),
      retry: vi.fn(),
    };
    return {
      catalog,
      locale: ref("de"),
      organizations: {
        organizations: ref<Owner[] | undefined>(),
        status: ref("pending"),
      },
      useOgcCatalogMock: vi.fn(
        (
          _language: unknown,
          _query: unknown,
          _concept: unknown,
          _owner: unknown,
        ) => catalog,
      ),
    };
  },
);

vi.mock("~/composables/useOgcCatalog", () => ({
  useOgcCatalog: useOgcCatalogMock,
}));
vi.mock("~/composables/useOrganizations", () => ({
  useOrganizations: () => organizations,
}));
vi.mock("@vueuse/core", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useInfiniteScroll: vi.fn(),
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale }),
}));

const stubs = {
  LayerCatalogRow: {
    props: ["dataset"],
    template: "<div role='row' data-testid='row-stub' :data-id='dataset.id' />",
  },
  UInput: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template: `<div><input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" /><slot name="trailing" /></div>`,
  },
  UButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
  USelectMenu: {
    props: ["modelValue", "items", "loading"],
    emits: ["update:modelValue"],
    template: `<div :data-loading="String(loading)"><button v-for="item in items" :key="item.id" :data-id="item.id" @click="$emit('update:modelValue', item.id)"><slot name="item-label" :item="item" /></button><slot v-if="!items.length" name="empty" /></div>`,
  },
};

function makeCollection(ids: string[]): DatasetCollection {
  return {
    type: "FeatureCollection",
    features: ids.map(
      (id): Dataset => ({
        id,
        properties: { type: "Dataset", title: id },
        links: [],
      }),
    ),
    links: [],
    numberMatched: ids.length,
  };
}

const panelScroller = shallowRef<HTMLElement | null>(null);

function mountTable() {
  return mount(LayerCatalogTable, {
    props: { conceptIds: [] },
    global: { stubs, provide: { [panelScrollerKey]: panelScroller } },
  });
}

function renderedIds(wrapper: ReturnType<typeof mountTable>) {
  return wrapper
    .findAll("[data-testid='row-stub']")
    .map((row) => row.attributes("data-id"));
}

function clearButton(wrapper: ReturnType<typeof mountTable>) {
  return wrapper.find("button[aria-label='Clear search']");
}

function infiniteScrollCall() {
  const [target, onLoadMore, options] =
    vi.mocked(useInfiniteScroll).mock.calls[0]!;
  return { target, onLoadMore, options: options! };
}

describe("LayerCatalogTable.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalog.state.value = { status: "pending" };
    catalog.hasMore.value = false;
    organizations.organizations.value = undefined;
    organizations.status.value = "pending";
    panelScroller.value = null;
  });

  it("loads the catalog in the current language", () => {
    mountTable();

    expect(useOgcCatalogMock.mock.calls[0]![0]).toBe(locale);
  });

  it("only loads the layers of the given concepts", async () => {
    const wrapper = mountTable();
    const concepts = useOgcCatalogMock.mock.calls[0]![2] as () => string[];
    expect(concepts()).toEqual([]);

    await wrapper.setProps({ conceptIds: ["soils", "geology"] });

    expect(concepts()).toEqual(["soils", "geology"]);
  });

  describe("owner filter", () => {
    const bfs: Owner = {
      id: "ch.bfs",
      name: "Bundesamt für Statistik BFS",
      acronym: "BFS",
    };
    const bafu: Owner = {
      id: "ch.bafu",
      name: "Bundesamt für Umwelt BAFU",
      acronym: "BAFU",
    };

    function ownerFilter(wrapper: ReturnType<typeof mountTable>) {
      return wrapper.get("[data-testid='catalog-owner-filter']");
    }

    it("offers the organizations once they are loaded", async () => {
      const wrapper = mountTable();
      expect(ownerFilter(wrapper).attributes("data-loading")).toBe("true");

      organizations.organizations.value = [bafu, bfs];
      organizations.status.value = "success";
      await nextTick();

      const options = ownerFilter(wrapper).findAll("button");
      expect(ownerFilter(wrapper).attributes("data-loading")).toBe("false");
      expect(options.map((option) => option.text())).toEqual([
        "BAFU (Bundesamt für Umwelt)",
        "BFS (Bundesamt für Statistik)",
      ]);
    });

    it("tells the user when the organizations could not be loaded", async () => {
      const wrapper = mountTable();
      expect(ownerFilter(wrapper).text()).toBe("");

      organizations.status.value = "error";
      await nextTick();

      expect(ownerFilter(wrapper).text()).toBe("layerCatalog.error");
    });

    it("loads only the layers of the selected owner", async () => {
      organizations.organizations.value = [bafu, bfs];
      const wrapper = mountTable();
      const owner = useOgcCatalogMock.mock.calls[0]![3] as Ref<
        string | undefined
      >;
      expect(owner.value).toBeUndefined();

      await ownerFilter(wrapper).get("[data-id='ch.bfs']").trigger("click");

      expect(owner.value).toBe("ch.bfs");
    });
  });

  describe("search", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      return () => vi.useRealTimers();
    });

    it("searches the catalog for what is typed, once the typing pauses", async () => {
      const wrapper = mountTable();
      const query = useOgcCatalogMock.mock.calls[0]![1] as Ref<string>;
      expect(isRef(query)).toBe(true);
      expect(query.value).toBe("");

      await wrapper.get("input").setValue("forest");
      expect(query.value).toBe("");

      await vi.advanceTimersByTimeAsync(100);
      expect(query.value).toBe("forest");
    });

    it("clears the search", async () => {
      const wrapper = mountTable();
      const query = useOgcCatalogMock.mock.calls[0]![1] as Ref<string>;
      expect(clearButton(wrapper).exists()).toBe(false);

      await wrapper.get("input").setValue("forest");
      await vi.advanceTimersByTimeAsync(100);
      expect(query.value).toBe("forest");

      await clearButton(wrapper).trigger("click");

      expect(wrapper.get("input").element.value).toBe("");
      expect(clearButton(wrapper).exists()).toBe(false);

      await vi.advanceTimersByTimeAsync(100);
      expect(query.value).toBe("");
    });

    it("does not search for a query cleared before the typing paused", async () => {
      const wrapper = mountTable();
      const query = useOgcCatalogMock.mock.calls[0]![1] as Ref<string>;

      await wrapper.get("input").setValue("forest");
      await clearButton(wrapper).trigger("click");
      await vi.advanceTimersByTimeAsync(100);

      expect(query.value).toBe("");
    });
  });

  it("shows a row per loaded layer", () => {
    catalog.state.value = {
      status: "success",
      data: makeCollection(["a", "b"]),
    };

    const wrapper = mountTable();

    expect(renderedIds(wrapper)).toEqual(["a", "b"]);
    expect(wrapper.text()).not.toContain("layerCatalog.loading");
    expect(wrapper.text()).not.toContain("layerCatalog.table.empty");
  });

  it("shows the loading state below the layers loaded so far", async () => {
    const wrapper = mountTable();
    expect(renderedIds(wrapper)).toEqual([]);
    expect(wrapper.text()).toContain("layerCatalog.loading");
    expect(wrapper.text()).not.toContain("layerCatalog.table.empty");

    catalog.state.value = { status: "pending", data: makeCollection(["a"]) };
    await nextTick();

    expect(renderedIds(wrapper)).toEqual(["a"]);
    expect(wrapper.text()).toContain("layerCatalog.loading");
  });

  it("tells the user when no layer matches", () => {
    catalog.state.value = { status: "success", data: makeCollection([]) };

    expect(mountTable().text()).toContain("layerCatalog.table.empty");
  });

  it("lets the user retry after an error, keeping the layers loaded so far", async () => {
    catalog.state.value = {
      status: "error",
      data: makeCollection(["a"]),
      error: new Error("catalog down"),
    };

    const wrapper = mountTable();

    expect(renderedIds(wrapper)).toEqual(["a"]);
    expect(wrapper.text()).toContain("layerCatalog.error");
    const retry = wrapper
      .findAll("button")
      .find((button) => button.text() === "layerCatalog.retry")!;
    await retry.trigger("click");

    expect(catalog.retry).toHaveBeenCalledOnce();
  });

  it("shows the error rather than an empty table when the first page fails", () => {
    catalog.state.value = { status: "error", error: new Error("down") };

    const wrapper = mountTable();

    expect(wrapper.text()).toContain("layerCatalog.error");
    expect(wrapper.text()).not.toContain("layerCatalog.table.empty");
  });

  it("loads more layers when scrolling the surrounding panel close to the bottom", () => {
    panelScroller.value = document.createElement("div");
    mountTable();

    const { target, onLoadMore, options } = infiniteScrollCall();
    expect(unref(target)).toBe(panelScroller.value);
    expect(onLoadMore).toBe(catalog.loadMore);
    expect(options.distance).toBe(200);
  });

  it("only loads more while there are more layers and no error", () => {
    const wrapper = mountTable();
    const canLoadMore = () =>
      infiniteScrollCall().options.canLoadMore!(wrapper.element as HTMLElement);

    catalog.state.value = { status: "success", data: makeCollection(["a"]) };
    expect(canLoadMore()).toBe(false);

    catalog.hasMore.value = true;
    expect(canLoadMore()).toBe(true);

    catalog.state.value = {
      status: "error",
      data: makeCollection(["a"]),
      error: new Error("down"),
    };
    expect(canLoadMore()).toBe(false);
  });
});
