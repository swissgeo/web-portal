import type { Dataset, DatasetCollection } from "@swissgeo/ogc";
import type { OgcCatalogState } from "~/composables/useOgcCatalog";
import type { Ref } from "vue";

import { mount } from "@vue/test-utils";
import { useInfiniteScroll } from "@vueuse/core";
import LayerCatalogTable from "~/components/sidebar/layerCatalog/LayerCatalogTable.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRef, nextTick, unref } from "vue";

const { catalog, locale, useOgcCatalogMock } = await vi.hoisted(async () => {
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
    useOgcCatalogMock: vi.fn((_language: unknown, _query: unknown) => catalog),
  };
});

vi.mock("~/composables/useOgcCatalog", () => ({
  useOgcCatalog: useOgcCatalogMock,
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
    template: "<tr data-testid='row-stub' :data-id='dataset.id' />",
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

function mountTable() {
  return mount(LayerCatalogTable, { global: { stubs } });
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
  });

  it("loads the catalog in the current language", () => {
    mountTable();

    expect(useOgcCatalogMock.mock.calls[0]![0]).toBe(locale);
  });

  it("searches the catalog for what is typed", async () => {
    const wrapper = mountTable();
    const query = useOgcCatalogMock.mock.calls[0]![1] as Ref<string>;
    expect(isRef(query)).toBe(true);
    expect(query.value).toBe("");

    await wrapper.get("input").setValue("forest");

    expect(query.value).toBe("forest");
  });

  it("clears the search", async () => {
    const wrapper = mountTable();
    const query = useOgcCatalogMock.mock.calls[0]![1] as Ref<string>;
    expect(clearButton(wrapper).exists()).toBe(false);

    await wrapper.get("input").setValue("forest");
    await clearButton(wrapper).trigger("click");

    expect(query.value).toBe("");
    expect(wrapper.get("input").element.value).toBe("");
    expect(clearButton(wrapper).exists()).toBe(false);
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

  it("loads more layers when scrolling close to the bottom", () => {
    const wrapper = mountTable();

    const { target, onLoadMore, options } = infiniteScrollCall();
    expect(unref(target)).toBe(wrapper.element);
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
