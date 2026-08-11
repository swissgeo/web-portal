import type { Layer as SourceLayer } from "@swissgeo/layers";

import { describe, expect, it } from "vitest";

import { convertFileLayerToMapLayer } from "../convertFileLayerToMapLayer";

describe("convertFileLayerToMapLayer", () => {
  it("maps file layer metadata to map layer metadata", () => {
    const layerData: SourceLayer = {
      data: `<xml>KML data here</xml>`,
      humanId: "K to the M to the L",
      info: {
        displayName: "Display KML",
      },
      isLoading: false,
      type: "kml",
      uuid: "kml-is-a-snowflake",
    };

    expect(convertFileLayerToMapLayer(layerData)).toEqual({
      data: `<xml>KML data here</xml>`,
      displayName: "Display KML",
      format: "KML",
      isVisible: true,
      layerId: "K to the M to the L",
      opacity: 1,
      uuid: "kml-is-a-snowflake",
    });
  });

  it("maps local GeoJSON file text to geoJsonData", () => {
    const geoJsonData = {
      features: [
        {
          geometry: {
            coordinates: [7.4386, 46.9511],
            type: "Point",
          },
          properties: { name: "A local point" },
          type: "Feature",
        },
      ],
      type: "FeatureCollection",
    };
    const layerData: SourceLayer = {
      data: JSON.stringify(geoJsonData),
      humanId: "Local GeoJSON",
      isLoading: false,
      type: "geojson",
      uuid: "geojson-is-a-snowflake",
    };

    expect(convertFileLayerToMapLayer(layerData)).toEqual({
      displayName: "Local GeoJSON",
      format: "GeoJSON",
      geoJsonData,
      isVisible: true,
      layerId: "Local GeoJSON",
      opacity: 1,
      uuid: "geojson-is-a-snowflake",
    });
  });

  it("requires local GeoJSON file data to be text", () => {
    const layerData: SourceLayer = {
      data: new Uint8Array([80, 75, 3, 4]),
      humanId: "Local GeoJSON",
      isLoading: false,
      type: "geojson",
      uuid: "geojson-is-a-snowflake",
    };

    expect(() => convertFileLayerToMapLayer(layerData)).toThrow(
      "GeoJSON file layer is missing file data",
    );
  });
});
