import type { SearchResult } from "@swissgeo/search";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";

import TopbarSearch from "../TopbarSearch.vue";

const searchStore = reactive({
  query: "",
  results: [] as SearchResult[],
  isSearching: false,
  hasError: false,
  hasResults: false,
  setSearchQuery: vi.fn(),
  clearSearch: vi.fn(),
});

mockNuxtImport("useToaster", () => () => ({ showError: vi.fn() }));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: "de" } }),
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
    props: ["items"],
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

function tabs(wrapper: ReturnType<typeof render>) {
  return wrapper.findComponent(stubs.UTabs).props("items") as {
    label: string;
    badge?: number;
  }[];
}

describe("TopbarSearch", () => {
  beforeEach(() => {
    searchStore.query = "";
    searchStore.results = [];
    searchStore.isSearching = false;
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

  it("emits the selected CMS result", async () => {
    searchStore.query = "uns";
    const entry = content("42", "Über uns");
    searchStore.results = [entry];

    const wrapper = render();
    await wrapper
      .find("[data-testid='content-search-results'] li")
      .trigger("click");

    expect(wrapper.emitted("result-selected")?.[0]).toEqual([entry]);
    expect(searchStore.clearSearch).toHaveBeenCalled();
  });
});
