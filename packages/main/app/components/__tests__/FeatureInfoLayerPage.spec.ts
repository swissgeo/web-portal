import type { AccordionItem } from "@nuxt/ui";
import type { FeatureData } from "@swissgeo/feature";

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";

import FeatureInfoLayerPage from "../featuresinfo/FeatureInfoLayerPage.vue";

type ItemWithPayload = AccordionItem & { featureData?: FeatureData };

/**
 * We stub UAccordion to avoid needing a Nuxt app for the real accordion, and
 * to avoid having to mock the functions within featureInfoContent.
 */
let itemsSeen: ItemWithPayload[] = [];

const UAccordionStub = defineComponent({
  name: "UAccordion",
  props: {
    items: { type: Array, required: true },
    type: { type: String, default: "single" },
  },
  setup(props, { slots }) {
    return () => {
      itemsSeen = props.items as ItemWithPayload[];
      return h("div", { class: "accordion-stub" }, [
        h("div", { class: "accordion-type" }, String(props.type)),
        ...(props.items as Array<{ label?: string }>).map((item, index) =>
          h(
            "div",
            { key: item.label ?? index, class: "accordion-item" },
            slots.body?.({ item, index }) ?? [],
          ),
        ),
      ]);
    };
  },
});

const FeatureInfoContentStub = defineComponent({
  name: "FeatureInfoContent",
  props: { featureData: { type: Object, required: true } },
  setup(props) {
    return () =>
      h("div", { class: "content-stub" }, props.featureData.featureId);
  },
});

function makeFeatureData(featureId: string): FeatureData {
  return {
    featureId,
    geometry: { type: "Point", coordinates: [2600000, 1200000] },
    content: { kind: "json", properties: { name: featureId } },
  };
}

function mountPage(featuresData: FeatureData[]) {
  return mount(FeatureInfoLayerPage, {
    props: { featuresData },
    global: {
      stubs: {
        UAccordion: UAccordionStub,
        FeatureInfoContent: FeatureInfoContentStub,
      },
    },
  });
}

describe("FeatureInfoLayerPage.vue", () => {
  it("creates one accordion item per feature, carrying its payload", () => {
    const features = [makeFeatureData("a"), makeFeatureData("b")];
    mountPage(features);

    expect(itemsSeen).toHaveLength(2);
    expect(itemsSeen[0]!.featureData).toStrictEqual(features[0]);
    expect(itemsSeen[1]!.featureData).toStrictEqual(features[1]);
  });

  it("labels items with the featureId", () => {
    mountPage([makeFeatureData("id-1"), makeFeatureData("id-2")]);

    expect(itemsSeen.map((item) => item.label)).toEqual(["id-1", "id-2"]);
  });

  it("opens only the first item by default", () => {
    mountPage([
      makeFeatureData("a"),
      makeFeatureData("b"),
      makeFeatureData("c"),
    ]);

    expect(itemsSeen.map((item) => item.defaultOpen)).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("allows multiple items open at once (type=multiple)", () => {
    const wrapper = mountPage([makeFeatureData("a")]);

    expect(wrapper.find(".accordion-type").text()).toBe("multiple");
  });

  it("renders one FeatureInfoContent per item, fed with the right feature", () => {
    const wrapper = mountPage([
      makeFeatureData("first"),
      makeFeatureData("second"),
    ]);

    const contents = wrapper.findAll(".content-stub");
    expect(contents).toHaveLength(2);
    expect(contents[0]!.text()).toBe("first");
    expect(contents[1]!.text()).toBe("second");
  });

  it("rebuilds the items when the featuresData prop changes (new selection)", async () => {
    const wrapper = mountPage([
      makeFeatureData("old-1"),
      makeFeatureData("old-2"),
    ]);

    await wrapper.setProps({ featuresData: [makeFeatureData("new-1")] });

    expect(itemsSeen).toHaveLength(1);
    expect(itemsSeen[0]!.featureData!.featureId).toBe("new-1");
    expect(itemsSeen[0]!.defaultOpen).toBe(true);
  });

  it("renders no items for an empty feature list", () => {
    const wrapper = mountPage([]);

    expect(wrapper.findAll(".accordion-item")).toHaveLength(0);
    expect(wrapper.findAll(".content-stub")).toHaveLength(0);
  });
});
