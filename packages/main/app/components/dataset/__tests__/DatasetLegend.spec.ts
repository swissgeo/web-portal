import type {
  Dataset,
  Distribution,
  DistributionCollection,
} from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DatasetDistributionLegend from "../DatasetDistributionLegend.vue";
import DatasetLegend from "../DatasetLegend.vue";

const wms: Distribution = {
  id: "wms",
  properties: {
    type: "Distribution",
    title: "Test distribution",
    protocol: "ogc:wms",
    externalIds: ["wms-layer"],
  },
};
const wmts: Distribution = {
  id: "wmts",
  properties: {
    type: "Distribution",
    title: "Test distribution",
    protocol: "ogc:wmts",
    externalIds: ["wmts-layer"],
  },
};

function render(features: Distribution[], preferredDistributionId?: string) {
  const dataset: Dataset = {
    id: "dataset",
    properties: {
      type: "Dataset",
      title: "Test dataset",
      preferredDistributionId,
    },
  };
  const distributionCollection: DistributionCollection = {
    type: "FeatureCollection",
    features,
    links: [],
  };
  return mount(DatasetLegend, {
    props: { dataset, distributionCollection },
    global: {
      stubs: {
        ClientOnly: { template: "<slot />" },
        DatasetDistributionLegend: true,
        LayerLegend: true,
      },
    },
  });
}

describe("DatasetLegend selection", () => {
  it("uses the preferred distribution and its external layer ID", () => {
    const wrapper = render([wms, wmts], "wmts");
    expect(
      wrapper.getComponent(DatasetDistributionLegend).props(),
    ).toMatchObject({
      distribution: wmts,
      layerId: "wmts-layer",
    });
  });

  it("uses the first distribution when no preference exists", () => {
    const wrapper = render([wms, wmts]);
    expect(
      wrapper.getComponent(DatasetDistributionLegend).props(),
    ).toMatchObject({
      distribution: wms,
      layerId: "wms-layer",
    });
  });

  it("does not substitute another distribution for a preferred STAC record", () => {
    const stac: Distribution = {
      id: "stac",
      properties: {
        type: "Distribution",
        title: "Test distribution",
        protocol: "ogcapi:stac",
        externalIds: ["collection"],
      },
    };
    const wrapper = render([wms, stac], "stac");
    expect(wrapper.findComponent(DatasetDistributionLegend).exists()).toBe(
      false,
    );
    expect(
      wrapper.getComponent({ name: "LayerLegend" }).props("legends"),
    ).toEqual([]);
  });

  it("shows no legend when the collection is empty", () => {
    const wrapper = render([]);
    expect(wrapper.findComponent(DatasetDistributionLegend).exists()).toBe(
      false,
    );
    expect(
      wrapper.getComponent({ name: "LayerLegend" }).props("legends"),
    ).toEqual([]);
  });
});
