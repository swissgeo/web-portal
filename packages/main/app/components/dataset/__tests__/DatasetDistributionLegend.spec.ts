import type * as Ogc from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const state = vi.hoisted(() => ({
  service: { isFetching: { value: false }, error: { value: null } },
  wms: {
    isFetching: { value: false },
    error: { value: null },
    wmsData: { value: { legends: [] } },
  },
  wmts: {
    isFetching: { value: false },
    error: { value: null },
    wmtsData: { value: { legends: [] } },
  },
}));
vi.mock("@swissgeo/ogc", async (importOriginal) => ({
  getGeoJsonLegends: (await importOriginal<typeof Ogc>()).getGeoJsonLegends,
  useService: () => state.service,
  useWmsCapabilities: () => state.wms,
  useWmtsCapabilities: () => state.wmts,
}));

import DatasetDistributionLegend from "../DatasetDistributionLegend.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: ref("de") }),
}));

function render(
  protocol: Ogc.Distribution["properties"]["protocol"] = "ogc:wms",
  links: Ogc.Distribution["links"] = [],
) {
  return mount(DatasetDistributionLegend, {
    props: {
      distribution: {
        id: "distribution",
        links,
        properties: { type: "Distribution", title: "Layer", protocol },
      },
      layerId: "layer",
    },
    global: {
      stubs: {
        LayerLegend: true,
        UBadge: { template: "<span><slot /></span>" },
      },
    },
  });
}

beforeEach(() => {
  for (const resource of [state.service, state.wms, state.wmts]) {
    resource.isFetching.value = false;
    resource.error.value = null;
  }
});

describe("DatasetDistributionLegend", () => {
  it.each(["service", "wms", "wmts"] as const)(
    "shows loading while %s is pending",
    (resource) => {
      state[resource].isFetching.value = true;
      const wrapper = render(resource === "wmts" ? "ogc:wmts" : "ogc:wms");
      expect(wrapper.get('[role="status"]').text()).toBe(
        "dataset.legendLoading",
      );
      expect(wrapper.findComponent({ name: "LayerLegend" }).exists()).toBe(
        false,
      );
    },
  );

  it.each(["service", "wms", "wmts"] as const)(
    "distinguishes %s failure from missing legend",
    (resource) => {
      Object.assign(state[resource], {
        error: ref(new Error("Request failed")),
      });
      const wrapper = render(resource === "wmts" ? "ogc:wmts" : "ogc:wms");
      expect(wrapper.get('[role="status"]').text()).toBe("dataset.legendError");
      expect(wrapper.findComponent({ name: "LayerLegend" }).exists()).toBe(
        false,
      );
    },
  );

  it("ignores the inactive protocol loading state", () => {
    state.wmts.isFetching.value = true;
    const wrapper = render("ogc:wms");
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it.each(["ogc:wms", "ogc:wmts"] as const)(
    "passes %s legend data to the existing renderer",
    (protocol) => {
      const legends = [{ href: "https://example.com/legend.png" }];
      Object.assign(state.wms, { wmsData: ref({ legends }) });
      Object.assign(state.wmts, { wmtsData: ref({ legends }) });
      const wrapper = render(protocol);
      expect(
        wrapper.getComponent({ name: "LayerLegend" }).props("legends"),
      ).toEqual(legends);
      expect(wrapper.find('[role="status"]').exists()).toBe(false);
    },
  );

  it("passes the BGDI legend of a GeoJSON layer to the renderer", () => {
    const wrapper = render("geojson", [
      {
        rel: "about",
        type: "application/geo+json",
        href: "https://data.geo.admin.ch/layer/layer_de.json",
      },
    ]);
    expect(
      wrapper.getComponent({ name: "LayerLegend" }).props("legends"),
    ).toEqual([
      {
        href: "https://api3.geo.admin.ch/static/images/legends/layer_de.png",
        format: "image/png",
      },
    ]);
  });
});
