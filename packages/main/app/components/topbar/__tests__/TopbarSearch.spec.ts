import type { SearchResult } from "@swissgeo/search";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive, ref } from "vue";

import TopbarSearch from "../TopbarSearch.vue";

const handleResultSelection = vi.fn();

const searchStore = reactive({
  query: "",
  results: [] as SearchResult[],
  coordinateResult: null,
  isSearching: false,
  hasError: false,
  get hasResults() {
    return this.results.length > 0;
  },
  get contentResults() {
    return this.results.filter((r) => r.resultType === "CONTENT");
  },
  get mapResults() {
    return this.results.filter((r) => r.resultType !== "CONTENT");
  },
  get hasMapResults() {
    return this.mapResults.length > 0;
  },
  setSearchQuery: vi.fn(),
  clearSearch: vi.fn(),
  keepSelectedQuery: vi.fn(),
  clearPinnedCoordinate: vi.fn(),
});

// the selection itself is covered by the composable's own test, and it needs a
// Nuxt app this component test does not boot
vi.mock("@/composables/useSearchSelection", () => ({
  useSearchSelection: () => ({ handleResultSelection }),
}));

mockNuxtImport("useToaster", () => () => ({ showError: vi.fn() }));

const locale = ref("de");

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale }),
}));

vi.mock("@swissgeo/skeleton", () => ({
  useSearchStore: () => searchStore,
  useDatasetPanelStore: () => ({ openDatasetPanel: vi.fn() }),
}));

vi.mock("@swissgeo/shared", () => ({
  sanitizeHtml: (input: string) => input,
}));

// Render every tab body, so the content tab can be asserted without driving
// the real tab interaction.
const stubs = {
  UPopover: {
    template: "<div><slot name='anchor' /><slot name='content' /></div>",
  },
  UTabs: {
    props: ["items", "modelValue"],
    template: "<div><slot name='map' /><slot name='contentPages' /></div>",
  },
  UInput: { template: "<input />" },
  UButton: { template: "<button />" },
  UIcon: { template: "<span />" },
  ClientOnly: { template: "<div><slot /></div>" },
};

const location = (id: string): SearchResult => ({
  resultType: "LOCATION",
  id,
  title: id,
  sanitizedTitle: id,
  description: "",
});

const content = (documentId: string, title: string): SearchResult => ({
  resultType: "CONTENT",
  id: `content-${documentId}`,
  title,
  sanitizedTitle: title,
  description: "",
});

function render() {
  return mount(TopbarSearch, { global: { stubs } });
}

function activeTab(wrapper: ReturnType<typeof render>) {
  return wrapper.findComponent(stubs.UTabs).props("modelValue") as string;
}

function tabs(wrapper: ReturnType<typeof render>) {
  return wrapper.findComponent(stubs.UTabs).props("items") as {
    label: string;
    badge?: number;
  }[];
}

describe("TopbarSearch", () => {
  // the mounted components all watch the same locale ref, a leftover one would
  // answer a language change on behalf of the component under test
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    searchStore.query = "";
    searchStore.results = [];
    searchStore.isSearching = false;
    locale.value = "de";
    handleResultSelection.mockClear();
    searchStore.setSearchQuery.mockClear();
    searchStore.clearSearch.mockClear();
    searchStore.keepSelectedQuery.mockClear();
  });

  it("lists the CMS results in the content pages tab", () => {
    searchStore.query = "uns";
    searchStore.results = [content("42", "Über uns"), location("bern")];

    const wrapper = render();
    const contentTab = wrapper.find("[data-testid='content-search-results']");

    expect(contentTab.exists()).toBe(true);
    expect(contentTab.text()).toContain("Über uns");
    // The location result belongs to the map tab, not this one.
    expect(contentTab.text()).not.toContain("bern");
  });

  it("counts the CMS results on the content tab badge only", () => {
    searchStore.query = "uns";
    searchStore.results = [
      content("42", "Über uns"),
      content("43", "Kontakt"),
      location("bern"),
    ];

    const [mapTab, contentTab] = tabs(render());

    expect(mapTab?.badge).toBe(1);
    expect(contentTab?.badge).toBe(2);
  });

  it("leaves both badges unset when nothing was found", () => {
    const [mapTab, contentTab] = tabs(render());

    expect(mapTab?.badge).toBeUndefined();
    expect(contentTab?.badge).toBeUndefined();
  });

  it("shows the empty state in the content tab once a search returned nothing", () => {
    searchStore.query = "zzzqqq";
    searchStore.results = [];

    const wrapper = render();

    expect(
      wrapper.find("[data-testid='content-search-results']").exists(),
    ).toBe(false);
    expect(wrapper.text()).toContain("search.no_results");
  });

  it("opens on the content tab when every hit is a CMS page", async () => {
    const wrapper = render();
    expect(activeTab(wrapper)).toBe("map");

    searchStore.query = "zecken";
    searchStore.results = [content("42", "Zecken")];
    await nextTick();

    expect(activeTab(wrapper)).toBe("content");
  });

  it("stays on the map tab when the map has hits of its own", async () => {
    const wrapper = render();

    searchStore.query = "bern";
    searchStore.results = [location("bern"), content("42", "Bern")];
    await nextTick();

    expect(activeTab(wrapper)).toBe("map");
  });

  it("runs the query again when the interface language changes", async () => {
    searchStore.query = "ticks";
    searchStore.results = [location("ticks")];
    render();

    locale.value = "en";
    await nextTick();

    expect(searchStore.setSearchQuery).toHaveBeenCalledWith("ticks", "en");
  });

  it("leaves a query too short to search alone on a language change", async () => {
    searchStore.query = "t";
    searchStore.results = [location("ticks")];
    render();

    locale.value = "en";
    await nextTick();

    expect(searchStore.setSearchQuery).not.toHaveBeenCalled();
  });

  // the field keeps the name of the selected result, searching it again would
  // pop the panel back open on top of the map the user just moved to
  it("leaves the query alone on a language change once a result was selected", async () => {
    searchStore.query = "Bern";
    searchStore.results = [];
    render();

    locale.value = "en";
    await nextTick();

    expect(searchStore.setSearchQuery).not.toHaveBeenCalled();
  });

  it("selects the CMS result that was clicked", async () => {
    searchStore.query = "uns";
    const entry = content("42", "Über uns");
    searchStore.results = [entry];

    const wrapper = render();
    await wrapper
      .find("[data-testid='content-search-results'] li")
      .trigger("click");

    expect(handleResultSelection).toHaveBeenCalledWith(entry);
  });

  it("keeps the name of the selected result in the field", async () => {
    searchStore.query = "ber";
    searchStore.results = [location("Bern")];

    const wrapper = render();
    await wrapper.find("[data-testid='search-results'] li").trigger("click");

    expect(searchStore.keepSelectedQuery).toHaveBeenCalledWith("Bern");
    expect(searchStore.clearSearch).not.toHaveBeenCalled();
  });

  // it would empty the field and take the clear button, the only way left of
  // removing the pin, away with it
  it("falls back to the typed query when the name sanitizes to nothing", async () => {
    searchStore.query = "ber";
    searchStore.results = [{ ...location("Bern"), sanitizedTitle: "" }];

    const wrapper = render();
    await wrapper.find("[data-testid='search-results'] li").trigger("click");

    expect(searchStore.keepSelectedQuery).toHaveBeenCalledWith("ber");
  });
});
