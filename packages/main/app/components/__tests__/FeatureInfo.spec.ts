import type { FeatureData } from "@swissgeo/feature";

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import FeatureInfo from "../featuresinfo/FeatureInfo.vue";

type LayerItem = {
  value?: string;
  label?: string;
  featuresData?: FeatureData[];
};

let accordionItemsSeen: LayerItem[] = [];
let defaultValueSeen: unknown = undefined;
let uiSeen: Record<string, unknown> | undefined = undefined;

/**
 * Nuxt auto import doesn't allow to intercept UAccordion through a mock, so we use a stub instead
 */
const UAccordionStub = defineComponent({
  name: "UAccordion",
  props: {
    items: { type: Array, required: true },
    defaultValue: { type: null, required: false, default: undefined },
    ui: { type: Object, required: false, default: undefined },
  },
  setup(props, { slots }) {
    return () => {
      accordionItemsSeen = props.items as LayerItem[];
      defaultValueSeen = props.defaultValue;
      uiSeen = props.ui as Record<string, unknown> | undefined;
      return h(
        "div",
        { class: "accordion-stub", "data-testid": "feature-info-accordion" },
        (props.items as LayerItem[]).map((item) =>
          h(
            "div",
            {
              class: "accordion-item",
              "data-testid": "feature-info-accordion-item",
            },
            [
              h(
                "div",
                { class: "accordion-trigger" },
                slots.default?.({ item }) ?? item.label ?? "",
              ),
              h(
                "div",
                { class: "accordion-body" },
                slots.body?.({ item }) ?? [],
              ),
            ],
          ),
        ),
      );
    };
  },
});

const FeatureInfoLayerPageStub = defineComponent({
  name: "FeatureInfoLayerPage",
  props: { featuresData: { type: Array, required: true } },
  setup(props) {
    return () =>
      h(
        "div",
        { class: "layer-page-stub", "data-testid": "feature-info-layer-page" },
        (props.featuresData as FeatureData[]).map((featureData) =>
          h(
            "div",
            { class: "feature", "data-testid": "feature-info-feature" },
            featureData.featureId,
          ),
        ),
      );
  },
});

vi.mock("@swissgeo/layers", () => ({
  useLayerStore: () => ({
    getLayer: vi.fn((uuid: string) => {
      if (uuid === "uuid-a") {
        return {
          info: { displayName: "Layer A" },
          humanId: "layer-a-human",
        };
      }
      if (uuid === "uuid-b") {
        return { info: {}, humanId: "layer-b-human" };
      }
      // unknown uuid: the store returns undefined in the real implementation
      return undefined;
    }),
  }),
}));

function makeFeatureData(featureId: string): FeatureData {
  return {
    featureId,
    geometry: { type: "Point", coordinates: [2600000, 1200000] },
    content: { kind: "json", properties: { name: featureId } },
  };
}

async function mountShell() {
  const { useFeaturesStore } = await import("@swissgeo/feature");
  const wrapper = mount(FeatureInfo, {
    global: {
      stubs: {
        UAccordion: UAccordionStub,
        UTooltip: {
          props: ["text"],
          template:
            '<span class="tooltip-stub" :data-tooltip-text="text"><slot /></span>',
        },
        FeatureInfoLayerPage: FeatureInfoLayerPageStub,
      },
    },
  });
  return { wrapper, useFeaturesStore };
}

describe("FeatureInfo.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    accordionItemsSeen = [];
    defaultValueSeen = undefined;
    uiSeen = undefined;
  });

  it("builds one accordion item per layer in the selection, keyed by layer uuid", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")],
      "uuid-b": [makeFeatureData("b1")],
    });
    await wrapper.vm.$nextTick();

    expect(accordionItemsSeen).toHaveLength(2);
    expect(accordionItemsSeen.map((item) => item.value)).toEqual([
      "uuid-a",
      "uuid-b",
    ]);
  });

  it("labels items with displayName, falling back to humanId then uuid", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")], // displayName
      "uuid-b": [makeFeatureData("b1")], // humanId fallback
      "uuid-unknown": [makeFeatureData("u1")], // uuid fallback
    });
    await wrapper.vm.$nextTick();

    expect(accordionItemsSeen.map((item) => item.label)).toEqual([
      "Layer A",
      "layer-b-human",
      "uuid-unknown",
    ]);
  });

  it("expands every layer by default (default-value carries all item values)", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")],
      "uuid-b": [makeFeatureData("b1")],
    });
    await wrapper.vm.$nextTick();

    expect(defaultValueSeen).toEqual(["uuid-a", "uuid-b"]);
  });

  it("renders every layer's page simultaneously (accordion, not tabs)", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1"), makeFeatureData("a2")],
      "uuid-b": [makeFeatureData("b1")],
    });
    await wrapper.vm.$nextTick();

    const features = wrapper.findAll("[data-testid='feature-info-feature']");
    expect(features).toHaveLength(3);
    expect(features.map((feature) => feature.text())).toEqual([
      "a1",
      "a2",
      "b1",
    ]);
  });

  it("carries each layer's features to its layer page", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")],
      "uuid-b": [makeFeatureData("b1"), makeFeatureData("b2")],
    });
    await wrapper.vm.$nextTick();

    const itemB = accordionItemsSeen.find((item) => item.value === "uuid-b");
    expect(itemB!.featuresData).toHaveLength(2);
    expect(
      itemB!.featuresData!.map((featureData) => featureData.featureId),
    ).toEqual(["b1", "b2"]);
  });

  it("shows the feature count next to the layer name in the item label", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1"), makeFeatureData("a2")],
    });
    await wrapper.vm.$nextTick();

    const firstItem = wrapper.findAll(
      "[data-testid='feature-info-accordion-item']",
    )[0]!;
    expect(firstItem.text()).toContain("Layer A");
    expect(firstItem.text()).toContain("2");
  });

  it("truncates the layer label and holds the full value in a tooltip", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({ "uuid-a": [makeFeatureData("a1")] });
    await wrapper.vm.$nextTick();

    const firstItem = wrapper.findAll(
      "[data-testid='feature-info-accordion-item']",
    )[0]!;
    expect(firstItem.find("span.truncate").exists()).toBe(true);
    expect(
      firstItem.find(".tooltip-stub").attributes("data-tooltip-text"),
    ).toBe("Layer A");
  });

  it("clips horizontal overflow while keeping the vertical scroll", async () => {
    const { wrapper } = await mountShell();

    expect(wrapper.classes()).toContain("overflow-x-hidden");
    expect(wrapper.classes()).toContain("overflow-y-auto");
  });

  it("makes layer headers sticky while the content scrolls", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({ "uuid-a": [makeFeatureData("a1")] });
    await wrapper.vm.$nextTick();

    expect(String(uiSeen?.trigger)).toContain("sticky");
  });

  it("renders nothing when the selection is empty", async () => {
    const { wrapper } = await mountShell();

    expect(
      wrapper.find("[data-testid='feature-info-accordion']").exists(),
    ).toBe(true); // UAccordion always rendered
    expect(accordionItemsSeen).toHaveLength(0);
    expect(
      wrapper.findAll("[data-testid='feature-info-feature']"),
    ).toHaveLength(0);
  });

  it("shows no layers dropped: every selected layer gets an item even without a name", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({ "uuid-unknown": [makeFeatureData("u1")] });
    await wrapper.vm.$nextTick();

    expect(accordionItemsSeen).toHaveLength(1);
    expect(accordionItemsSeen[0]!.label).toBe("uuid-unknown");
  });
});
