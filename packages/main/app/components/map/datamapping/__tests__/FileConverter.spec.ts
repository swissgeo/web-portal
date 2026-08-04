import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import FileConverter from "../FileConverter.vue";

describe("FileConverter", () => {
  it("maps the data correctly", async () => {
    const layerData = {
      data: `<xml>KML data here</xml>`,
      type: "kml" as const,
      uuid: "kml-is-a-snowflake",
      humanId: "K to the M to the L",
      isLoading: false,
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: layerData,
      },
    });

    const updateEvents = wrapper.emitted("update");

    expect(wrapper.emitted("update")).toHaveLength(1);
    expect(updateEvents![0]).toEqual([
      {
        ...layerData,
        format: "KML",
        layerId: "K to the M to the L",
        displayName: "K to the M to the L",
        isVisible: true,
        opacity: 1,
      },
    ]);

    await wrapper.setProps({
      layer: {
        ...layerData,
      },
    });
    expect(updateEvents).toHaveLength(2);
    expect(updateEvents![1]![0]).toHaveProperty("isVisible", true);

    await wrapper.setProps({
      layer: {
        ...layerData,
      },
    });
    expect(updateEvents).toHaveLength(3);
  });

  it("maps a GeoJSON file to the GeoJSON format with parsed data", () => {
    const featureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: {
          data: JSON.stringify(featureCollection),
          type: "geojson" as const,
          uuid: "geojson-uuid",
          humanId: "my-drawing.geojson",
          isLoading: false,
        },
      },
    });

    const emitted = wrapper.emitted("update")![0]![0] as Record<
      string,
      unknown
    >;
    expect(emitted.format).toBe("GeoJSON");
    expect(emitted.geoJsonData).toEqual(featureCollection);
  });

  it("keeps the crs property of a GeoJSON file", () => {
    const featureCollection = {
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:2056" } },
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [2600000, 1200000] },
        },
      ],
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: {
          data: JSON.stringify(featureCollection),
          type: "geojson" as const,
          uuid: "geojson-crs-uuid",
          humanId: "lufttemperatur.geojson",
          isLoading: false,
        },
      },
    });

    const emitted = wrapper.emitted("update")![0]![0] as Record<
      string,
      unknown
    >;
    expect(emitted.geoJsonData).toEqual(featureCollection);
  });

  it.each([
    ["malformed", "{ not valid json"],
    ["not GeoJSON", '{"title":"un JSON standard"}'],
    ["a FeatureCollection without features", '{"type":"FeatureCollection"}'],
  ])("emits no update when the GeoJSON data is %s", (_label, data) => {
    const wrapper = mount(FileConverter, {
      props: {
        layer: {
          data,
          type: "geojson" as const,
          uuid: "geojson-uuid",
          humanId: "broken.geojson",
          isLoading: false,
        },
      },
    });

    expect(wrapper.emitted("update")).toBeUndefined();
  });

  it("emits the remove signal when unmounted", () => {
    const layerData = {
      data: `<xml>KML data here</xml>`,
      type: "kml" as const,
      uuid: "kml-is-a-snowflake",
      humanId: "K to the M to the L",
      isVisible: false,
      opacity: 0,
      isLoading: false,
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: layerData,
      },
    });

    wrapper.unmount();
    expect(wrapper.emitted("remove")).toHaveLength(1);
  });
});
