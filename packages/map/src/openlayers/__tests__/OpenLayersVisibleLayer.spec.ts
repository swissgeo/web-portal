import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { Layer } from "@/types/layers";

import OpenLayersVisibleLayer from "../OpenLayersVisibleLayer.vue";

const stubs = {
  OpenLayersGeoJSONLayer: {
    template: '<div data-testid="remote-geojson" />',
  },
  OpenLayersLocalGeoJSONLayer: {
    template: '<div data-testid="local-geojson" />',
  },
};

describe("OpenLayersVisibleLayer", () => {
  it("renders local GeoJSON file layers with the local GeoJSON renderer", () => {
    const localGeoJsonLayer = {
      format: "GeoJSON",
      layerId: "local.geojson",
      uuid: "local-geojson",
      opacity: 1,
      isVisible: true,
      data: JSON.stringify({
        type: "FeatureCollection",
        features: [],
      }),
      geoJsonData: {
        type: "FeatureCollection",
        features: [],
      },
    } as unknown as Layer;

    const wrapper = mount(OpenLayersVisibleLayer, {
      props: {
        layer: localGeoJsonLayer,
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="local-geojson"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="remote-geojson"]').exists()).toBe(false);
  });

  it("renders GeoJSON layers without local file data with the remote GeoJSON renderer", () => {
    const remoteGeoJsonLayer = {
      format: "GeoJSON",
      layerId: "remote.geojson",
      uuid: "remote-geojson",
      opacity: 1,
      isVisible: true,
      geoJsonData: {
        type: "FeatureCollection",
        features: [],
      },
    } as Layer;

    const wrapper = mount(OpenLayersVisibleLayer, {
      props: {
        layer: remoteGeoJsonLayer,
      },
      global: {
        stubs,
      },
    });

    expect(wrapper.find('[data-testid="remote-geojson"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="local-geojson"]').exists()).toBe(false);
  });
});
