import type { SearchResult } from "@swissgeo/search";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import SearchCategory from "../SearchCategory.vue";

mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));

mockNuxtImport("useLocalePath", () => () => (path: string) => `/de${path}`);

const { sanitizeHtmlMock } = vi.hoisted(() => ({
  sanitizeHtmlMock: vi.fn((input: string) => input),
}));

vi.mock("@swissgeo/shared", () => ({
  sanitizeHtml: sanitizeHtmlMock,
}));

const UScrollAreaStub = { template: "<div><slot /></div>" };

const stubs = {
  UScrollArea: UScrollAreaStub,
  UIcon: { template: "<span />" },
  UButton: { template: "<button />" },
  ClientOnly: { template: "<div><slot /></div>" },
};

const entries: SearchResult[] = [
  {
    resultType: "LOCATION",
    id: "location-0",
    title: "Bern",
    sanitizedTitle: "Bern",
    description: "",
  },
  {
    resultType: "FEATURE",
    id: "feature-1",
    title: "Tannenwald",
    sanitizedTitle: "Tannenwald",
    description: "",
  },
  {
    resultType: "LAYER",
    id: "layer-2",
    title: "Waldrand",
    sanitizedTitle: "Waldrand",
    description: "",
  },
];

function render(props: { title?: string; tabStart: boolean }) {
  // attached to the document: the focus tests assert document.activeElement
  return mount(SearchCategory, {
    props: { results: entries, ...props },
    global: { stubs },
    attachTo: document.body,
  });
}

function activeTestId() {
  return (document.activeElement as HTMLElement).dataset.testid;
}

describe("SearchCategory", () => {
  enableAutoUnmount(afterEach);

  describe("rendering", () => {
    it("renders the heading above the entries when a title is given", () => {
      const wrapper = render({ title: "Orte", tabStart: false });

      expect(wrapper.find(".sticky").text()).toBe("Orte");
      // the heading stays visible while its section scrolls, on its own
      // opaque backdrop: surface-* utilities do not exist in this repo
      const headingClasses = wrapper.get(".sticky").attributes("class") ?? "";
      expect(headingClasses).toContain("top-0");
      expect(headingClasses).toContain("z-10");
      expect(headingClasses).toContain("bg-default");
      expect(headingClasses).toContain("border-b");
      expect(wrapper.findAll("li")).toHaveLength(entries.length);
    });

    it("renders no heading when the title is left out", () => {
      const wrapper = render({ tabStart: false });

      expect(wrapper.find(".sticky").exists()).toBe(false);
      expect(wrapper.findAll("li")).toHaveLength(entries.length);
    });

    it("scrolls through its own scroll area", () => {
      const wrapper = render({ title: "Orte", tabStart: false });

      expect(wrapper.findComponent(UScrollAreaStub).exists()).toBe(true);
    });
  });

  describe("tab stop", () => {
    it("forwards the tab start to the first entry only", () => {
      const wrapper = render({ tabStart: true });

      const tabIndexes = wrapper
        .findAll("li")
        .map((entry) => entry.attributes("tabindex"));
      expect(tabIndexes).toEqual(["0", "-1", "-1"]);
    });

    it("gives no entry a tab stop without the tab start", () => {
      const wrapper = render({ tabStart: false });

      const tabIndexes = wrapper
        .findAll("li")
        .map((entry) => entry.attributes("tabindex"));
      expect(tabIndexes).toEqual(["-1", "-1", "-1"]);
    });
  });

  describe("events", () => {
    it("re-emits the selection of an entry with its payload", async () => {
      const wrapper = render({ tabStart: true });

      await wrapper.findAll("li")[0]!.trigger("click");

      expect(wrapper.emitted("select")).toEqual([[entries[0]]]);
    });

    it("re-emits reaching the first entry from below", async () => {
      const wrapper = render({ tabStart: true });

      await wrapper.findAll("li")[0]!.trigger("keydown.up");

      expect(wrapper.emitted("firstEntryReached")).toHaveLength(1);
    });

    it("re-emits reaching the last entry from above", async () => {
      const wrapper = render({ tabStart: true });

      await wrapper.findAll("li")[entries.length - 1]!.trigger("keydown.down");

      expect(wrapper.emitted("lastEntryReached")).toHaveLength(1);
    });
  });

  describe("focus management", () => {
    it("focuses its first entry", () => {
      const wrapper = render({ tabStart: true });
      const vm = wrapper.vm as InstanceType<typeof SearchCategory>;

      vm.focusFirstEntry();

      expect(activeTestId()).toBe("search-result-entry-location-0");
    });

    it("focuses its last entry", () => {
      const wrapper = render({ tabStart: true });
      const vm = wrapper.vm as InstanceType<typeof SearchCategory>;

      vm.focusLastEntry();

      expect(activeTestId()).toBe("search-result-entry-layer-2");
    });
  });
});
