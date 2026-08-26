import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";

import type { Layer } from "@/types/layers";

import OpenLayersVisibleLayer from "../OpenLayersVisibleLayer.vue";

const stubs = {
  OpenLayersGeoJSONLayer: {
    template: '<div data-testid="geojson" />',
  },
  OpenLayersKMZLayer: defineComponent({
    name: "OpenLayersKMZLayer",
    props: ["layer"],
    emits: ["error"],
    template: '<div data-testid="kmz" />',
  }),
};

const geoJsonData = {
  type: "FeatureCollection",
  features: [] as const,
};

const geoJsonLayers = [
  {
    source: "local",
    layer: {
      format: "GeoJSON",
      layerId: "local.geojson",
      uuid: "local-geojson",
      opacity: 1,
      isVisible: true,
      data: JSON.stringify(geoJsonData),
      geoJsonData,
    } as unknown as Layer,
  },
  {
    source: "remote",
    layer: {
      format: "GeoJSON",
      layerId: "remote.geojson",
      uuid: "remote-geojson",
      opacity: 1,
      isVisible: true,
      geoJsonData,
    } as Layer,
  },
];

describe("OpenLayersVisibleLayer", () => {
  it.each(geoJsonLayers)(
    "renders a $source GeoJSON layer with the GeoJSON renderer",
    ({ layer }) => {
      const wrapper = mount(OpenLayersVisibleLayer, {
        props: {
          layer,
        },
        global: {
          stubs,
        },
      });

      expect(wrapper.find('[data-testid="geojson"]').exists()).toBe(true);
    },
  );

  it("adds the layer UUID to KMZ renderer errors", () => {
    const layer = {
      format: "KMZ",
      layerId: "local.kmz",
      uuid: "local-kmz",
      opacity: 1,
      isVisible: true,
      data: new Uint8Array([1, 2, 3]),
    } as Layer;
    const failure = new Error("Invalid KMZ");
    const wrapper = mount(OpenLayersVisibleLayer, {
      props: { layer },
      global: { stubs },
    });

    wrapper.getComponent(stubs.OpenLayersKMZLayer).vm.$emit("error", failure);

    expect(wrapper.emitted("layerError")).toEqual([[layer.uuid, failure]]);
  });
});
