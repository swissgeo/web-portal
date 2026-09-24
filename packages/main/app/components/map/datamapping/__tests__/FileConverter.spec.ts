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
        data: `<xml>KML data here</xml>`,
        displayName: "K to the M to the L",
        format: "KML",
        isVisible: true,
        layerId: "K to the M to the L",
        opacity: 1,
        uuid: "kml-is-a-snowflake",
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
      features: [
        {
          type: "Feature",
          properties: { name: "A local point" },
          geometry: {
            type: "Point",
            coordinates: [7.4386, 46.9511],
          },
        },
      ],
    };
    const layerData = {
      data: JSON.stringify(featureCollection),
      type: "geojson" as const,
      uuid: "geojson-uuid",
      humanId: "my-drawing.geojson",
      isLoading: false,
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: layerData,
      },
    });

    expect(wrapper.emitted("update")![0]).toEqual([
      {
        displayName: "my-drawing.geojson",
        format: "GeoJSON",
        geoJsonData: featureCollection,
        isVisible: true,
        layerId: "my-drawing.geojson",
        opacity: 1,
        uuid: "geojson-uuid",
      },
    ]);
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

  it("maps local KMZ file binary data", () => {
    const kmzData = new Uint8Array([80, 75, 3, 4]);
    const layerData = {
      data: kmzData,
      type: "kmz" as const,
      uuid: "kmz-is-a-snowflake",
      humanId: "Local KMZ",
      isLoading: false,
    };
    const wrapper = mount(FileConverter, {
      props: {
        layer: layerData,
      },
    });

    const updateEvents = wrapper.emitted("update");

    expect(updateEvents).toHaveLength(1);
    expect(updateEvents![0]).toEqual([
      {
        data: kmzData,
        displayName: "Local KMZ",
        format: "KMZ",
        isVisible: true,
        layerId: "Local KMZ",
        opacity: 1,
        uuid: "kmz-is-a-snowflake",
      },
    ]);
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
    expect(wrapper.emitted("remove")).toEqual([[layerData.uuid]]);
  });
});
