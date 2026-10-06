import type { SearchResult } from "@swissgeo/search";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, reactive, ref } from "vue";

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
  get locationResults() {
    return this.results.filter((r) => r.resultType === "LOCATION");
  },
  get layerResults() {
    return this.results.filter((r) => r.resultType === "LAYER");
  },
  get featureResults() {
    return this.results.filter((r) => r.resultType === "FEATURE");
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
mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);

const locale = ref("de");

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale }),
}));

vi.mock("@swissgeo/skeleton", () => ({
  useSearchStore: () => searchStore,
}));

vi.mock("@swissgeo/shared", () => ({
  sanitizeHtml: (input: string) => input,
}));

// exposes its input element the way UInput does, so the component under test
// can hand focus back to the search field on arrow up at the very first entry
const UInputStub = defineComponent({
  setup(_, { expose }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    expose({ inputRef });
    return { inputRef };
  },
  template: "<input ref='inputRef' />",
});

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
  UInput: UInputStub,
  UButton: { template: "<button />" },
  UIcon: { template: "<span />" },
  UScrollArea: { template: "<div><slot /></div>" },
  ClientOnly: { template: "<div><slot /></div>" },
};

const location = (id: string): SearchResult => ({
  resultType: "LOCATION",
  id,
  title: id,
  sanitizedTitle: id,
  description: "",
});

const layer = (id: string): SearchResult => ({
  resultType: "LAYER",
  id,
  title: id,
  sanitizedTitle: id,
  description: "",
});

const feature = (id: string): SearchResult => ({
  resultType: "FEATURE",
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
  // attached to the document: the keyboard tests assert document.activeElement
  return mount(TopbarSearch, {
    global: { stubs },
    attachTo: document.body,
  });
}

function activeTestId() {
  return (document.activeElement as HTMLElement).dataset.testid;
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

  it("empties the field when a layer is selected", async () => {
    searchStore.query = "wald";
    searchStore.results = [
      {
        resultType: "LAYER",
        id: "waldgrenzen",
        title: "Statische Waldgrenzen",
        sanitizedTitle: "Statische Waldgrenzen",
        description: "",
        layerId: "waldgrenzen",
      } as SearchResult,
    ];

    const wrapper = render();
    await wrapper.find("[data-testid='search-results'] li").trigger("click");

    expect(searchStore.clearSearch).toHaveBeenCalled();
    expect(searchStore.keepSelectedQuery).not.toHaveBeenCalled();
  });

  it("closes results when opening dataset details and keeps the search available", async () => {
    const wrapper = render();
    searchStore.query = "wald";
    searchStore.results = [{ ...location("waldgrenzen"), resultType: "LAYER" }];
    await nextTick();
    expect(wrapper.emitted("update:open")?.at(-1)).toEqual([true]);

    await wrapper.get("[data-testid='search-result-info-0']").trigger("click");

    expect(wrapper.emitted("update:open")?.at(-1)).toEqual([false]);
    expect(handleResultSelection).not.toHaveBeenCalled();
    expect(searchStore.clearSearch).not.toHaveBeenCalled();
    expect(searchStore.keepSelectedQuery).not.toHaveBeenCalled();
    expect(searchStore.query).toBe("wald");

    await wrapper.get("input").trigger("click");
    expect(wrapper.emitted("update:open")?.at(-1)).toEqual([true]);
  });

  describe("result sections", () => {
    it("renders the three categories in order with their headings", () => {
      searchStore.query = "wald";
      searchStore.results = [
        location("bern"),
        layer("waldrand"),
        feature("tannenwald"),
      ];

      const wrapper = render();
      const sections = wrapper.findAll("[data-testid^='search-category-']");

      expect(
        sections.map((section) => section.attributes("data-testid")),
      ).toEqual([
        "search-category-locations",
        "search-category-layers",
        "search-category-features",
      ]);
      expect(sections[0]!.text()).toContain("search.locations_results_header");
      expect(sections[1]!.text()).toContain("search.layers_results_header");
      expect(sections[2]!.text()).toContain("search.features_results_header");
    });

    it("renders no DOM for categories without results", () => {
      searchStore.query = "bern";
      searchStore.results = [location("bern"), feature("altstadt")];

      const wrapper = render();

      expect(
        wrapper.find("[data-testid='search-category-locations']").exists(),
      ).toBe(true);
      expect(
        wrapper.find("[data-testid='search-category-features']").exists(),
      ).toBe(true);
      expect(
        wrapper.find("[data-testid='search-category-layers']").exists(),
      ).toBe(false);
    });

    it("gives every category an equal share of one fixed budget", () => {
      searchStore.query = "wald";
      searchStore.results = [location("bern"), layer("waldrand")];

      const wrapper = render();
      const budgetClasses =
        wrapper.get("[data-testid='search-results']").attributes("class") ?? "";

      // a definite height is what makes the equal split expressible: the
      // budget container lays the categories out but never scrolls itself
      expect(budgetClasses).toContain("flex");
      expect(budgetClasses).toContain("h-[60dvh]");
      expect(budgetClasses).toContain("sm:h-96");
      expect(budgetClasses).not.toContain("overflow-y-auto");
      for (const section of wrapper.findAll(
        "[data-testid^='search-category-']",
      )) {
        // each category claims an equal share (1/3, 1/2, all of it) and
        // scrolls on its own (the scroll itself needs a layout engine)
        const sectionClasses = section.attributes("class") ?? "";
        expect(sectionClasses).toContain("min-h-0");
        expect(sectionClasses).toContain("flex-1");
      }
    });
  });

  describe("keyboard navigation across categories", () => {
    it("moves focus to the next category on arrow down at the last entry", async () => {
      searchStore.query = "wald";
      searchStore.results = [
        location("bern"),
        location("basel"),
        layer("waldrand"),
      ];

      const wrapper = render();
      await wrapper
        .get("[data-testid='search-result-entry-location-1']")
        .trigger("keydown.down");

      expect(activeTestId()).toBe("search-result-entry-layer-0");
    });

    it("moves focus to the previous category on arrow up at the first entry", async () => {
      searchStore.query = "wald";
      searchStore.results = [
        location("bern"),
        location("basel"),
        layer("waldrand"),
      ];

      const wrapper = render();
      await wrapper
        .get("[data-testid='search-result-entry-layer-0']")
        .trigger("keydown.up");

      expect(activeTestId()).toBe("search-result-entry-location-1");
    });

    it("keeps focus on the very last entry on arrow down", async () => {
      searchStore.query = "wald";
      searchStore.results = [layer("waldrand"), feature("tanne")];

      const wrapper = render();
      const lastEntry = wrapper.get(
        "[data-testid='search-result-entry-feature-0']",
      );
      (lastEntry.element as HTMLElement).focus();
      await lastEntry.trigger("keydown.down");

      expect(activeTestId()).toBe("search-result-entry-feature-0");
    });

    it("returns focus to the search input on arrow up at the very first entry", async () => {
      searchStore.query = "bern";
      searchStore.results = [location("bern"), layer("wald")];

      const wrapper = render();
      await wrapper
        .get("[data-testid='search-result-entry-location-0']")
        .trigger("keydown.up");

      expect(document.activeElement).toBe(
        wrapper.get("[data-testid='topbar-search-input']").element,
      );
    });

    it("focuses the first result on arrow down from the input", async () => {
      searchStore.query = "bern";
      searchStore.results = [location("bern"), layer("wald")];

      const wrapper = render();
      await wrapper
        .get("[data-testid='topbar-search-input']")
        .trigger("keydown.down");
      await nextTick();

      expect(activeTestId()).toBe("search-result-entry-location-0");
    });
  });

  describe("tab stops", () => {
    it("keeps a single tab stop on the first entry of the first category", () => {
      searchStore.query = "wald";
      searchStore.results = [
        location("bern"),
        location("basel"),
        layer("waldrand"),
        feature("tanne"),
      ];

      const wrapper = render();
      const tabStops = wrapper
        .findAll("[data-testid='search-results'] li")
        .filter((entry) => entry.attributes("tabindex") === "0");

      expect(tabStops).toHaveLength(1);
      expect(tabStops[0]!.attributes("data-testid")).toBe(
        "search-result-entry-location-0",
      );
    });

    it("moves the tab stop to the next category when locations are empty", () => {
      searchStore.query = "wald";
      searchStore.results = [layer("waldrand"), feature("tanne")];

      const wrapper = render();
      const tabStops = wrapper
        .findAll("[data-testid='search-results'] li")
        .filter((entry) => entry.attributes("tabindex") === "0");

      expect(tabStops).toHaveLength(1);
      expect(tabStops[0]!.attributes("data-testid")).toBe(
        "search-result-entry-layer-0",
      );
    });

    it("keeps a tab stop on the first entry of the content tab", () => {
      searchStore.query = "uns";
      searchStore.results = [
        content("42", "Über uns"),
        content("43", "Kontakt"),
      ];

      const wrapper = render();

      expect(
        wrapper
          .get("[data-testid='content-search-results'] li")
          .attributes("tabindex"),
      ).toBe("0");
    });
  });
});
