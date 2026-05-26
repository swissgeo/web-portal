import type { Layer } from "@swissgeo/layers";

import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";

type RoundedVM = { selectBackgroundCallback: (_layer: Layer | null) => void };

// Use vi.hoisted so these refs are available inside the hoisted vi.mock factory.
const { mockSelectorOpen, mockOnSelectBackground, mockToggleShowSelector } =
  vi.hoisted(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ref } = require("vue");
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

import BackgroundSelectorRounded from "~/components/map/BackgroundSelectorRounded.vue";

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

describe("BackgroundSelectorRounded.vue", () => {
  it("always renders the trigger button", () => {
    const wrapper = mount(BackgroundSelectorRounded, { props: defaultProps });
    expect(
      wrapper.find('[data-testid="background-selector-trigger"]').exists(),
    ).toBe(true);
  });

  it("shows no option buttons when the selector is closed", () => {
    mockSelectorOpen.value = false;
    const wrapper = mount(BackgroundSelectorRounded, { props: defaultProps });
    expect(wrapper.find('[data-testid="void"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="uuid-grau"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="uuid-farbe"]').exists()).toBe(false);
  });

  it("shows all option buttons when the selector is open", () => {
    mockSelectorOpen.value = true;
    const wrapper = mount(BackgroundSelectorRounded, { props: defaultProps });
    expect(wrapper.find('[data-testid="void"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="uuid-grau"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="uuid-farbe"]').exists()).toBe(true);
  });

  it("does not emit selectBackground when the current layer is re-selected", async () => {
    const wrapper = mount(BackgroundSelectorRounded, { props: defaultProps });
    (wrapper.vm as unknown as RoundedVM).selectBackgroundCallback(farbeLayer);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("selectBackground")).toBeFalsy();
  });

  it("does not emit selectBackground when void is re-selected as current", async () => {
    const wrapper = mount(BackgroundSelectorRounded, {
      props: { ...defaultProps, currentBackgroundLayer: voidLayer },
    });
    (wrapper.vm as unknown as RoundedVM).selectBackgroundCallback(voidLayer);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("selectBackground")).toBeFalsy();
  });

  it("emits selectBackground when a different layer is selected", async () => {
    const wrapper = mount(BackgroundSelectorRounded, { props: defaultProps });
    (wrapper.vm as unknown as RoundedVM).selectBackgroundCallback(grauLayer);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("selectBackground")?.[0]).toEqual([grauLayer]);
  });
});
