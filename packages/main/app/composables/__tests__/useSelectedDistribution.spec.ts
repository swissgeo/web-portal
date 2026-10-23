import type {
  Dataset,
  Distribution,
  DistributionCollection,
} from "@swissgeo/ogc";

import { useSelectedDistribution } from "~/composables/useSelectedDistribution";
import { getDatasetVariants } from "~/utils/datasetVariants";
import { describe, expect, it } from "vitest";
import { ref } from "vue";

function makeDistribution(id: string, metaInformation?: boolean): Distribution {
  return {
    id,
    properties: {
      type: "Distribution",
      title: id,
      protocol: "ogc:wms",
      externalIds: [`${id}-layer`],
      metaInformation,
    },
  };
}

const dataLayer = makeDistribution("gefahrenkarten:wms");
const availabilityMap = makeDistribution(
  "gefahrenkarten-availability:wms",
  true,
);
const download = makeDistribution("gefahrenkarten:stac");

const collection: DistributionCollection = {
  type: "FeatureCollection",
  features: [download, dataLayer, availabilityMap],
  links: [],
};

function makeDataset(aggregated?: boolean): Dataset {
  return {
    id: "gefahrenkarten",
    properties: {
      type: "Dataset",
      title: "Gefahrenkarten",
      preferredDistributionId: dataLayer.id,
      aggregated,
    },
  };
}

describe("getDatasetVariants", () => {
  it.each`
    case                                  | aggregated   | features                        | expected
    ${"data layer, then availability"}    | ${true}      | ${[availabilityMap, dataLayer]} | ${[dataLayer, availabilityMap]}
    ${"no variants when not aggregated"}  | ${undefined} | ${[dataLayer, availabilityMap]} | ${[]}
    ${"no variants without availability"} | ${true}      | ${[dataLayer, download]}        | ${[]}
    ${"no variants without data layer"}   | ${true}      | ${[availabilityMap, download]}  | ${[]}
  `("$case", ({ aggregated, features, expected }) => {
    expect(
      getDatasetVariants(makeDataset(aggregated), { ...collection, features }),
    ).toEqual(expected);
  });
});

describe("useSelectedDistribution", () => {
  it.each`
    case                                         | aggregated   | selectedId            | expected
    ${"uses the data layer by default"}          | ${true}      | ${undefined}          | ${dataLayer}
    ${"uses the selected availability map"}      | ${true}      | ${availabilityMap.id} | ${availabilityMap}
    ${"ignores a selected non-variant"}          | ${true}      | ${download.id}        | ${dataLayer}
    ${"ignores an unknown selected id"}          | ${true}      | ${"unknown:wms"}      | ${dataLayer}
    ${"ignores a selection when not aggregated"} | ${undefined} | ${availabilityMap.id} | ${dataLayer}
  `("$case", ({ aggregated, selectedId, expected }) => {
    const { distribution } = useSelectedDistribution(
      ref(makeDataset(aggregated)),
      ref(collection),
      selectedId,
    );

    expect(distribution.value).toEqual(expected);
  });

  it("follows a change of the selected id", () => {
    const selectedId = ref<string>();
    const { distribution, layerId } = useSelectedDistribution(
      ref(makeDataset(true)),
      ref(collection),
      selectedId,
    );

    selectedId.value = availabilityMap.id;

    expect(distribution.value).toEqual(availabilityMap);
    expect(layerId.value).toBe("gefahrenkarten-availability:wms-layer");
  });
});
