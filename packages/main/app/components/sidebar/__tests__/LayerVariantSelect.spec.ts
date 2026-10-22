import type {
  Dataset,
  Distribution,
  DistributionCollection,
} from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import LayerVariantSelect from "@/components/sidebar/LayerVariantSelect.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const { distributionCollection } = vi.hoisted(() => {
  const holder: { value: DistributionCollection | null } = { value: null };
  return { distributionCollection: holder };
});

vi.mock("@swissgeo/ogc", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("@swissgeo/ogc")>();
  return {
    ...actual,
    useDistributionCollection: () => ({
      distributionCollection: ref(distributionCollection.value),
    }),
  };
});

function makeDistribution(
  id: string,
  title: string,
  metaInformation?: boolean,
): Distribution {
  return {
    id,
    properties: {
      type: "Distribution",
      title,
      protocol: "ogc:wms",
      externalIds: [id],
      metaInformation,
    },
  };
}

const dataLayer = makeDistribution(
  "gefahrenkarten:wms",
  "Synoptische Gefahrenübersicht",
);
const availabilityMap = makeDistribution(
  "gefahrenkarten-availability:wms",
  "Verfügbarkeit",
  true,
);

const dataset: Dataset = {
  id: "gefahrenkarten",
  properties: {
    type: "Dataset",
    title: "Gefahrenkarten",
    preferredDistributionId: dataLayer.id,
    aggregated: true,
  },
};

const USelect = {
  name: "USelect",
  props: ["modelValue", "items"],
  emits: ["update:modelValue"],
  template: "<div />",
};

const UTooltip = { name: "UTooltip", props: ["text"], template: "<slot />" };

function mountSelect(selectedDistributionId?: string) {
  return mount(LayerVariantSelect, {
    props: { dataset, selectedDistributionId },
    global: { stubs: { USelect, UTooltip } },
  });
}

function setDistributions(features: Distribution[]) {
  distributionCollection.value = {
    type: "FeatureCollection",
    features,
    links: [],
  };
}

describe("LayerVariantSelect.vue", () => {
  beforeEach(() => {
    setDistributions([availabilityMap, dataLayer]);
  });

  it.each`
    selectedDistributionId | shown
    ${undefined}           | ${dataLayer}
    ${availabilityMap.id}  | ${availabilityMap}
  `(
    "offers both variants and shows $shown.id for selected=$selectedDistributionId",
    ({ selectedDistributionId, shown }) => {
      const wrapper = mountSelect(selectedDistributionId);

      expect(wrapper.getComponent(UTooltip).props("text")).toBe(
        shown.properties.title,
      );
      expect(wrapper.getComponent(USelect).props()).toEqual({
        modelValue: shown.id,
        items: [
          { label: "Synoptische Gefahrenübersicht", value: dataLayer.id },
          { label: "Verfügbarkeit", value: availabilityMap.id },
        ],
      });
    },
  );

  it.each`
    choice                | emitted
    ${availabilityMap.id} | ${[[availabilityMap.id]]}
    ${dataLayer.id}       | ${undefined}
  `("emits the choice $choice only when it changes", ({ choice, emitted }) => {
    const wrapper = mountSelect();

    wrapper.getComponent(USelect).vm.$emit("update:modelValue", choice);

    expect(wrapper.emitted("select")).toEqual(emitted);
  });

  it("renders nothing when the availability map is missing", () => {
    setDistributions([dataLayer]);

    expect(mountSelect().html()).not.toContain("layers.variant");
  });
});
