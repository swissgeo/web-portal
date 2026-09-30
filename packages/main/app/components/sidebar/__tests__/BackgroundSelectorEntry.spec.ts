import type { Layer } from "@swissgeo/layers";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

// vue-i18n is aliased to a stub in vitest.config.ts, so no manual mock needed.
// useBackgroundSelector's PNG imports resolve correctly via the ~ alias.
import BackgroundSelectorEntry from "@/components/sidebar/backgroundSelector/BackgroundSelectorEntry.vue";

const voidLayer = null;
const mockLayer = {
  uuid: "test-uuid",
  humanId: "ch.swisstopo.pixelkarte-farbe",
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
      expect(wrapper.find("button").attributes("data-testid")).toBe(
        "background-selector-void",
      );
    });

    it("is the layer name for a real layer", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: mockLayer, isCurrent: false },
      });
      expect(wrapper.find("button").attributes("data-testid")).toBe(
        "background-selector-ch.swisstopo.pixelkarte-farbe",
      );
    });
  });

  describe("active class", () => {
    it("is present on the label when isCurrent is true", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: true },
      });
      expect(wrapper.find(".bg-accent-active").exists()).toBe(true);
    });

    it("is absent when isCurrent is false", () => {
      const wrapper = mount(BackgroundSelectorEntry, {
        props: { backgroundLayer: voidLayer, isCurrent: false },
      });
      expect(wrapper.find(".bg-accent-active").exists()).toBe(false);
    });
  });

  it("renders a thumbnail image for a real layer", () => {
    const wrapper = mount(BackgroundSelectorEntry, {
      props: { backgroundLayer: mockLayer, isCurrent: false },
    });
    expect(wrapper.find("img").exists()).toBe(true);
  });

  it("does not render a thumbnail image for the void layer", () => {
    const wrapper = mount(BackgroundSelectorEntry, {
      props: { backgroundLayer: voidLayer, isCurrent: false },
    });
    expect(wrapper.find("img").exists()).toBe(false);
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
