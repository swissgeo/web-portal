import type {
  Contact,
  Dataset,
  Distribution,
  DistributionCollection,
} from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import DatasetContact from "../DatasetContact.vue";
import DatasetDetail from "../DatasetDetail.vue";
import DatasetLinkList from "../DatasetLinkList.vue";
import DatasetServiceList from "../DatasetServiceList.vue";

mockNuxtImport("useAppConfig", () => () => ({ ui: {} }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));

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
      stubs: {
        DatasetLinkList: true,
        DatasetServiceList: true,
        DatasetLegend: {
          props: ["dataset", "distributionCollection"],
          template: "<div data-testid=legend-stub />",
        },
      },
    },
  });
}

async function selectTab(
  wrapper: ReturnType<typeof mountDetail>,
  label: string,
) {
  const tab = wrapper
    .findAll('[role="tab"]')
    .find((tab) => tab.text() === label);
  expect(tab).toBeDefined();
  await tab!.trigger("keydown", { key: "Enter" });
  await flushPromises();
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
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(4);
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

  it.each<{ properties: Distribution["properties"]; visible: boolean }>([
    {
      properties: {
        type: "Distribution",
        title: "Downloads",
        protocol: "ogcapi:stac",
      },
      visible: true,
    },
    {
      properties: {
        type: "Distribution",
        title: "Data",
        protocol: "ogc:wms",
        metaInformation: false,
      },
      visible: true,
    },
    {
      properties: { type: "Distribution", title: "Data", protocol: "ogc:wmts" },
      visible: true,
    },
    {
      properties: {
        type: "Distribution",
        title: "Availability",
        protocol: "ogc:wms",
        metaInformation: true,
      },
      visible: false,
    },
    {
      properties: {
        type: "Distribution",
        title: "Availability",
        protocol: "ogc:wmts",
        metaInformation: true,
      },
      visible: false,
    },
    {
      properties: {
        type: "Distribution",
        title: "GeoJSON",
        protocol: "ogc:geojson",
      },
      visible: false,
    },
    { properties: { type: "Distribution", title: "Unknown" }, visible: false },
  ])(
    "shows only data services: $properties",
    async ({ properties, visible }) => {
      const distribution: Distribution = { id: "service", properties };
      const wrapper = mountDetail(makeDataset(), {
        type: "FeatureCollection",
        links: [],
        features: [distribution],
      });

      await selectTab(wrapper, "dataset.dataAccess");
      const services = wrapper.findComponent(DatasetServiceList);
      expect(services.exists()).toBe(visible);
      if (visible) {
        expect(services.props("distributions")).toEqual([distribution]);
      }
    },
  );

  it("keeps distinct data layers that use the same service", async () => {
    const features: Distribution[] = ["first-layer", "second-layer"].map(
      (id) => ({
        id,
        properties: { type: "Distribution", title: id, protocol: "ogc:wms" },
        links: [
          { rel: "dataservice", href: "https://example.com/shared-service" },
        ],
      }),
    );
    const wrapper = mountDetail(makeDataset(), {
      type: "FeatureCollection",
      links: [],
      features,
    });

    await selectTab(wrapper, "dataset.dataAccess");
    expect(
      wrapper.getComponent(DatasetServiceList).props("distributions"),
    ).toEqual(features);
  });

  it("preserves the supplied GeoCat link and service inputs", async () => {
    const dataset = makeDataset();
    const metadata = {
      rel: "alternate",
      href: "https://www.geocat.ch/metadata",
    };
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

    await selectTab(wrapper, "dataset.metadata");
    expect(wrapper.getComponent(DatasetLinkList).props("links")).toEqual([
      metadata,
    ]);
    await selectTab(wrapper, "dataset.dataAccess");
    expect(
      wrapper.getComponent(DatasetServiceList).props("distributions"),
    ).toEqual(distributionCollection.features);
  });

  it.each([
    {
      href: "https://www.geocat.ch/geonetwork/srv/ger/catalog.search#/metadata/id",
      visible: true,
    },
    { href: "https://geocat.ch/metadata/id", visible: true },
    { href: "https://WWW.GEOCAT.CH/metadata/id", visible: true },
    {
      href: "https://services.example.com?redirect=https://www.geocat.ch",
      visible: false,
    },
    { href: "https://www.geocat.ch.example.com/metadata/id", visible: false },
    { href: "https://geocat.ch@example.com/metadata/id", visible: false },
    { href: "javascript:alert('geocat.ch')", visible: false },
    { href: "not a URL", visible: false },
  ])(
    "shows only supplied GeoCat web links: $href",
    async ({ href, visible }) => {
      const dataset = makeDataset();
      const link = { rel: "alternate", href, title: "GeoCat Metadata" };
      dataset.links = [link];
      const wrapper = mountDetail(dataset);

      await selectTab(wrapper, "dataset.metadata");
      const links = wrapper.findComponent(DatasetLinkList);
      expect(links.exists()).toBe(visible);
      if (visible) {
        expect(links.props("links")).toEqual([link]);
        expect(wrapper.text()).toContain("dataset.metadata");
      }
    },
  );

  it("omits metadata when absent and clears it on dataset change", async () => {
    const dataset = makeDataset();
    dataset.links = [
      { rel: "alternate", href: "https://www.geocat.ch/metadata/id" },
    ];
    const wrapper = mountDetail(dataset);
    await selectTab(wrapper, "dataset.metadata");
    expect(wrapper.findComponent(DatasetLinkList).exists()).toBe(true);

    await wrapper.setProps({ dataset: makeDataset() });

    expect(wrapper.findComponent(DatasetLinkList).exists()).toBe(false);
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(4);
  });

  it("keeps the legend mounted across tab changes", async () => {
    const wrapper = mountDetail(makeDataset());
    const legend = wrapper.get('[data-testid="legend-stub"]').element;
    await selectTab(wrapper, "layers.legend.title");
    await selectTab(wrapper, "dataset.dataAccess");
    await selectTab(wrapper, "layers.legend.title");
    expect(wrapper.get('[data-testid="legend-stub"]').element).toBe(legend);
  });

  it("starts on Overview and resets when a different dataset opens", async () => {
    const wrapper = mountDetail(makeDataset([], "First description"));
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe(
      "dataset.overview",
    );
    await selectTab(wrapper, "dataset.metadata");
    expect(
      wrapper.find('[data-testid="dataset-description"]').isVisible(),
    ).toBe(false);

    await wrapper.setProps({
      dataset: {
        ...makeDataset([], "Second description"),
        id: "second.dataset",
      },
    });
    await flushPromises();

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe(
      "dataset.overview",
    );
    expect(wrapper.get('[data-testid="dataset-description"]').text()).toBe(
      "Second description",
    );
  });
});
