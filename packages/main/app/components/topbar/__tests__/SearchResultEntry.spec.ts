import type { SearchResult } from "@swissgeo/search";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { SearchResultTypesEnum } from "@swissgeo/search";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import SearchResultEntry from "../SearchResultEntry.vue";

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
  });
});

vi.mock("@swissgeo/skeleton", () => ({
  useDatasetPanelStore: vi.fn(() => ({
    openDatasetPanel: vi.fn(),
  })),
}));

const UIconStub = {
  template: "<span :data-testid=\"$attrs['data-testid']\" />",
  inheritAttrs: false,
};

const UButtonStub = {
  template: "<button :data-testid=\"$attrs['data-testid']\" />",
  inheritAttrs: false,
};

describe("SearchResultEntry", () => {
  const entries: SearchResult[] = [
    {
      resultType: SearchResultTypesEnum.location,
      id: "id-0",
      title: "Location Title",
      description: "Location Description",
      sanitizedTitle: "Sanitized 0",
    },
    {
      resultType: SearchResultTypesEnum.feature,
      id: "id-1",
      title: "Feature Title",
      description: "Feature Description",
      sanitizedTitle: "Sanitized 1",
    },
    {
      resultType: SearchResultTypesEnum.layer,
      id: "id-2",
      title: "Layer Title",
      description: "Layer Description",
      sanitizedTitle: "Sanitized 2",
    },
  ];

  function mountEntry(entry: SearchResult, index = 0) {
    return mount(SearchResultEntry, {
      props: { entry, index },
      global: {
        stubs: { UIcon: UIconStub, UButton: UButtonStub },
      },
      attachTo: document.body,
    });
  }

  describe("rendering", () => {
    it("renders location entry with correct icon", () => {
      const wrapper = mountEntry(entries[0]!);

      const item = wrapper.find(
        '[data-testid="search-result-entry-location-0"]',
      );
      expect(item.exists()).toBe(true);

      const icon = wrapper.find('[data-testid="icon-location"]');
      expect(icon.exists()).toBe(true);

      wrapper.unmount();
    });

    it("renders feature entry with correct icon", () => {
      const wrapper = mountEntry(entries[1]!, 1);

      const icon = wrapper.find('[data-testid="icon-feature"]');
      expect(icon.exists()).toBe(true);

      wrapper.unmount();
    });

    it("renders layer entry with info button", () => {
      const wrapper = mountEntry(entries[2]!, 2);

      const icon = wrapper.find('[data-testid="icon-layer"]');
      expect(icon.exists()).toBe(true);

      const infoButton = wrapper.find('[data-testid="search-result-info-2"]');
      expect(infoButton.exists()).toBe(true);

      wrapper.unmount();
    });

    it("does not show info button for location entries", () => {
      const wrapper = mountEntry(entries[0]!);

      const infoButton = wrapper.find('[data-testid^="search-result-info-"]');
      expect(infoButton.exists()).toBe(false);

      wrapper.unmount();
    });

    it("renders title as HTML", () => {
      const wrapper = mountEntry(entries[0]!);

      const title = wrapper.find(".min-w-0");
      expect(title.html()).toContain("Location Title");

      wrapper.unmount();
    });
  });

  describe("click handling", () => {
    it("emits select event when clicked", async () => {
      const wrapper = mountEntry(entries[0]!);

      await wrapper.find("li").trigger("click");

      expect(wrapper.emitted("select")).toHaveLength(1);

      wrapper.unmount();
    });

    it("emits select event on enter keyup", async () => {
      const wrapper = mountEntry(entries[0]!);

      await wrapper.find("li").trigger("keyup.enter");

      expect(wrapper.emitted("select")).toHaveLength(1);

      wrapper.unmount();
    });
  });

  describe("keyboard navigation", () => {
    it("emits firstEntryReached when arrow up on first item", async () => {
      const wrapper = mountEntry(entries[0]!, 0);

      await wrapper.find("li").trigger("keydown.up");

      expect(wrapper.emitted("firstEntryReached")).toHaveLength(1);

      wrapper.unmount();
    });

    it("emits lastEntryReached when arrow down on last item", async () => {
      const wrapper = mountEntry(entries[2]!, 2);

      await wrapper.find("li").trigger("keydown.down");

      expect(wrapper.emitted("lastEntryReached")).toHaveLength(1);

      wrapper.unmount();
    });
  });

  describe("tabindex", () => {
    it("has tabindex 0 for first item", () => {
      const wrapper = mountEntry(entries[0]!, 0);

      const li = wrapper.find("li");
      expect(li.attributes("tabindex")).toBe("0");

      wrapper.unmount();
    });

    it("has tabindex -1 for non-first items", () => {
      const wrapper = mountEntry(entries[1]!, 1);

      const li = wrapper.find("li");
      expect(li.attributes("tabindex")).toBe("-1");

      wrapper.unmount();
    });
  });
});
