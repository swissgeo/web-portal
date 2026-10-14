import type { FeatureData } from "@swissgeo/feature";

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import FeatureInfo from "../featuresinfo/FeatureInfo.vue";

type TabItem = { value?: string; label?: string; featuresData?: FeatureData[] };

let tabsItemsSeen: TabItem[] = [];

/**
 * Nuxt auto import doesn't allow to intercept Utabs through a mock, so we use a stub instead
 */
const UTabsStub = defineComponent({
  name: "UTabs",
  props: {
    items: { type: Array, required: true },
    modelValue: { type: String, default: undefined },
  },
  emits: ["update:modelValue"],
  setup(props, { slots }) {
    const active = () =>
      (props.modelValue ?? (props.items[0] as TabItem | undefined)?.value) as
        | string
        | undefined;
    return () => {
      tabsItemsSeen = props.items as TabItem[];
      return h(
        "div",
        { class: "tabs-stub", "data-testid": "feature-info-tabs" },
        [
          ...(props.items as TabItem[]).map((item) =>
            h(
              "button",
              {
                class: "tab-trigger",
                "data-value": item.value,
                type: "button",
              },
              slots.default?.({ item }) ?? item.label ?? "",
            ),
          ),
          h(
            "div",
            { class: "tab-content" },
            props.items
              .filter((item) => (item as TabItem).value === active())
              .map((item) => slots.content?.({ item }) ?? []),
          ),
        ],
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
        UTabs: UTabsStub,
        UTooltip: {
          template: "<span><slot /></span>",
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
    tabsItemsSeen = [];
  });

  it("builds one tab per layer in the selection, keyed by layer uuid", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")],
      "uuid-b": [makeFeatureData("b1")],
    });
    await wrapper.vm.$nextTick();

    expect(tabsItemsSeen).toHaveLength(2);
    expect(tabsItemsSeen.map((tab) => tab.value)).toEqual(["uuid-a", "uuid-b"]);
  });

  it("labels tabs with displayName, falling back to humanId then uuid", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")], // displayName
      "uuid-b": [makeFeatureData("b1")], // humanId fallback
      "uuid-unknown": [makeFeatureData("u1")], // uuid fallback
    });
    await wrapper.vm.$nextTick();

    expect(tabsItemsSeen.map((tab) => tab.label)).toEqual([
      "Layer A",
      "layer-b-human",
      "uuid-unknown",
    ]);
  });

  it("renders the first tab's layer page by default", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1"), makeFeatureData("a2")],
      "uuid-b": [makeFeatureData("b1")],
    });
    await wrapper.vm.$nextTick();

    const features = wrapper.findAll("[data-testid='feature-info-feature']");
    expect(features).toHaveLength(2);
    expect(features[0]!.text()).toBe("a1");
    expect(features[1]!.text()).toBe("a2");
  });

  it("carries each layer's features to its tab's layer page", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")],
      "uuid-b": [makeFeatureData("b1"), makeFeatureData("b2")],
    });
    await wrapper.vm.$nextTick();

    const tabB = tabsItemsSeen.find((tab) => tab.value === "uuid-b");
    expect(tabB!.featuresData).toHaveLength(2);
    expect(
      tabB!.featuresData!.map((featureData) => featureData.featureId),
    ).toEqual(["b1", "b2"]);
  });

  it("renders nothing when the selection is empty", async () => {
    const { wrapper } = await mountShell();

    expect(wrapper.find("[data-testid='feature-info-tabs']").exists()).toBe(
      true,
    ); // UTabs always rendered
    expect(tabsItemsSeen).toHaveLength(0);
    expect(
      wrapper.findAll("[data-testid='feature-info-feature']"),
    ).toHaveLength(0);
  });

  it("resets to the first tab when a new selection replaces the old one", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({
      "uuid-a": [makeFeatureData("a1")],
      "uuid-b": [makeFeatureData("b1")],
    });
    await wrapper.vm.$nextTick();

    // emulate the user picking the second tab through v-model
    wrapper.findComponent(UTabsStub).vm.$emit("update:modelValue", "uuid-b");
    await wrapper.vm.$nextTick();

    // a new click replaces the whole selection → back to first tab
    store.setSelection({ "uuid-a": [makeFeatureData("a2")] });
    await wrapper.vm.$nextTick();

    const renderedFeatures = wrapper.findAll(
      "[data-testid='feature-info-feature']",
    );
    expect(renderedFeatures).toHaveLength(1);
    expect(renderedFeatures[0]!.text()).toBe("a2");
  });

  it("shows no layers dropped: every selected layer gets a tab even without a name", async () => {
    const { wrapper } = await mountShell();
    const store = (await import("@swissgeo/feature")).useFeaturesStore();

    store.setSelection({ "uuid-unknown": [makeFeatureData("u1")] });
    await wrapper.vm.$nextTick();

    expect(tabsItemsSeen).toHaveLength(1);
    expect(tabsItemsSeen[0]!.label).toBe("uuid-unknown");
  });
});
