import type { Layer } from "@swissgeo/layers";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
// vue-i18n is aliased to a stub in vitest.config.ts, so no manual mock needed.
// useBackgroundSelector's PNG imports resolve correctly via the ~ alias.
import BackgroundSelectorEntry from "~/components/map/BackgroundSelectorEntry.vue";
import { describe, it, expect, vi } from "vitest";

const voidLayer = null;
const mockLayer = {
  uuid: "test-uuid",
  data: { id: "ch.swisstopo.pixelkarte-farbe" },
} as unknown as Layer;

mockNuxtImport("useI18n", () => {
  return () => ({
    t: vi.fn((key: string) => key),
  });
});

describe("BackgroundSelectorEntry.vue", () => {
  describe("data-testid attribute", () => {
    it('is "void" for the void layer', () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: false },
      });
      expect(wrapper.find("button").attributes("data-testid")).toBe("void");
    });

    it("is the layer uuid for a real layer", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: mockLayer, isCurrent: false },
      });
      expect(wrapper.find("button").attributes("data-testid")).toBe(
        "test-uuid",
      );
    });
  });

  describe("active class", () => {
    it("is present when isCurrent is true", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: true },
      });
      expect(wrapper.find("button").classes()).toContain("active");
    });

    it("is absent when isCurrent is false", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: false },
      });
      expect(wrapper.find("button").classes()).not.toContain("active");
    });
  });

  describe("folded class", () => {
    it("is present when folded prop is true", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: false, folded: true },
      });
      expect(wrapper.find("button").classes()).toContain("folded");
    });

    it("is absent by default", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: false },
      });
      expect(wrapper.find("button").classes()).not.toContain("folded");
    });
  });

  it("renders a thumbnail image", () => {
    const wrapper = mount(BackgroundSelectorEntry, {
      props: { backgroundLayer: voidLayer, isCurrent: false },
    });
    expect(wrapper.find("img").exists()).toBe(true);
  });

  it("emits click when the button is clicked", async () => {
    const wrapper = mount(BackgroundSelectorEntry, {
      props: { backgroundLayer: voidLayer, isCurrent: false },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });

  it("emits click for every individual click", async () => {
    const wrapper = mount(BackgroundSelectorEntry, {
      props: { backgroundLayer: voidLayer, isCurrent: false },
    });
    await wrapper.find("button").trigger("click");
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(2);
  });
});
