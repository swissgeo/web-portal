import type { Layer } from "@swissgeo/layers";

import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

type SquaredVM = { selectBackgroundCallback: (_layer: Layer | null) => void };

// Use vi.hoisted so these refs are available inside the hoisted vi.mock factory.
const { mockSelectorOpen, mockOnSelectBackground, mockToggleShowSelector } =
  await vi.hoisted(async () => {
    const { ref } = await import("vue");
    return {
      mockSelectorOpen: ref(false),
      mockOnSelectBackground: vi.fn(),
      mockToggleShowSelector: vi.fn(),
    };
  });

vi.mock("~/components/map/useBackgroundSelector", () => ({
  default: vi.fn(() => ({
    selectorOpen: mockSelectorOpen,
    getImageForBackgroundLayer: vi.fn(() => "test.png"),
    onSelectBackground: mockOnSelectBackground,
    toggleShowSelector: mockToggleShowSelector,
  })),
}));

import BackgroundSelectorSquared from "~/components/map/BackgroundSelectorSquared.vue";

// MapBackgroundSelectorEntry is a Nuxt auto-imported component — stub it.
const stubs = { MapBackgroundSelectorEntry: true };

const voidLayer = null;
const grauLayer = {
  uuid: "uuid-grau",
  dataset: { id: "ch.swisstopo.pixelkarte-grau" },
} as unknown as Layer;
const farbeLayer = {
  uuid: "uuid-farbe",
  dataset: { id: "ch.swisstopo.pixelkarte-farbe" },
} as unknown as Layer;

const defaultProps = {
  backgroundLayers: [voidLayer, grauLayer, farbeLayer],
  currentBackgroundLayer: farbeLayer,
};

beforeEach(() => {
  mockSelectorOpen.value = false;
  mockOnSelectBackground.mockClear();
  mockToggleShowSelector.mockClear();
});

describe("BackgroundSelectorSquared.vue", () => {
  it("always renders the trigger entry", () => {
    const wrapper = mount(BackgroundSelectorSquared, {
      props: defaultProps,
      global: { stubs },
    });
    expect(
      wrapper.findAll("map-background-selector-entry-stub").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows no option entries when the selector is closed", () => {
    mockSelectorOpen.value = false;
    const wrapper = mount(BackgroundSelectorSquared, {
      props: defaultProps,
      global: { stubs },
    });
    // Only the trigger entry should be rendered (1 stub total)
    expect(wrapper.findAll("map-background-selector-entry-stub").length).toBe(
      1,
    );
  });

  it("shows all option entries plus the trigger when the selector is open", () => {
    mockSelectorOpen.value = true;
    const wrapper = mount(BackgroundSelectorSquared, {
      props: defaultProps,
      global: { stubs },
    });
    // options (3) + trigger (1)
    expect(wrapper.findAll("map-background-selector-entry-stub").length).toBe(
      defaultProps.backgroundLayers.length + 1,
    );
  });

  it("does not emit selectBackground when the current layer is re-selected", async () => {
    const wrapper = mount(BackgroundSelectorSquared, {
      props: defaultProps,
      global: { stubs },
    });
    (wrapper.vm as unknown as SquaredVM).selectBackgroundCallback(farbeLayer);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("selectBackground")).toBeFalsy();
  });

  it("emits selectBackground when a different layer is selected", async () => {
    const wrapper = mount(BackgroundSelectorSquared, {
      props: defaultProps,
      global: { stubs },
    });
    (wrapper.vm as unknown as SquaredVM).selectBackgroundCallback(grauLayer);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("selectBackground")?.[0]).toEqual([grauLayer]);
  });
});
