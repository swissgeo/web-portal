import type { Contact, Dataset, DistributionCollection } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DatasetContact from "../DatasetContact.vue";
import DatasetDetail from "../DatasetDetail.vue";
import DatasetLinkList from "../DatasetLinkList.vue";
import DatasetServiceList from "../DatasetServiceList.vue";

mockNuxtImport("useAppConfig", () => () => ({ ui: {} }));

function makeDataset(contacts?: Contact[], description?: string): Dataset {
  return {
    id: "example.dataset",
    properties: { type: "Dataset", title: "Example", description, contacts },
  };
}

function mountDetail(
  dataset: Dataset,
  distributionCollection: DistributionCollection | null = null,
) {
  return mount(DatasetDetail, {
    props: { dataset, distributionCollection },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { DatasetLinkList: true, DatasetServiceList: true },
    },
  });
}

describe("DatasetDetail Overview", () => {
  it("shows the full description and all supplied contacts", () => {
    const description = "A long description.\n".repeat(40).trim();
    const contacts = [
      { organization: "First office", role: "owner" },
      { organization: "Second office", country: "CH" },
    ];
    const wrapper = mountDetail(makeDataset(contacts, description));

    expect(wrapper.get('[data-testid="dataset-description"]').text()).toBe(
      description,
    );
    expect(wrapper.findAllComponents(DatasetContact)).toHaveLength(2);
    expect(wrapper.text()).toContain("First office");
    expect(wrapper.text()).toContain("Second office");
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it.each([undefined, [], [{ organization: "  ", role: "", country: "" }]])(
    "omits the contact section when there is no contact content: %j",
    (contacts) => {
      const wrapper = mountDetail(makeDataset(contacts, "Description"));

      expect(wrapper.find('[data-testid="dataset-contacts"]').exists()).toBe(
        false,
      );
      expect(wrapper.text()).not.toContain("dataset.contacts");
      expect(wrapper.get('[data-testid="dataset-description"]').text()).toBe(
        "Description",
      );
    },
  );

  it("shows contacts without requiring a description", () => {
    const wrapper = mountDetail(makeDataset([{ organization: "Office" }]));

    expect(wrapper.find('[data-testid="dataset-description"]').exists()).toBe(
      false,
    );
    expect(wrapper.get('[data-testid="dataset-contacts"]').text()).toContain(
      "Office",
    );
  });

  it("removes old contacts when the dataset changes", async () => {
    const wrapper = mountDetail(makeDataset([{ organization: "Office" }]));

    await wrapper.setProps({ dataset: makeDataset([], "New description") });

    expect(wrapper.findComponent(DatasetContact).exists()).toBe(false);
    expect(wrapper.text()).toContain("New description");
  });

  it("preserves the existing link and service inputs", () => {
    const dataset = makeDataset();
    const metadata = { rel: "alternate", href: "https://example.com/metadata" };
    dataset.links = [
      { rel: "self", href: "https://example.com/record" },
      metadata,
    ];
    const distributionCollection: DistributionCollection = {
      type: "FeatureCollection",
      links: [],
      features: [
        {
          id: "example.wms",
          properties: {
            type: "Distribution",
            title: "WMS",
            protocol: "ogc:wms",
          },
        },
      ],
    };
    const wrapper = mountDetail(dataset, distributionCollection);

    expect(wrapper.getComponent(DatasetLinkList).props("links")).toEqual([
      metadata,
    ]);
    expect(
      wrapper.getComponent(DatasetServiceList).props("distributions"),
    ).toEqual(distributionCollection.features);
  });
});
