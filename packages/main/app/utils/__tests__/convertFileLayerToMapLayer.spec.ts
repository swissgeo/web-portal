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

  it("throws for dataset layers", () => {
    const layerData: SourceLayer = {
      data: {
        id: "ds",
        type: "Collection",
        records: [],
        itemType: "Dataset",
        title: "Test",
      } as unknown as SourceLayer["data"],
      humanId: "dataset-layer",
      isLoading: false,
      type: "dataset",
      uuid: "dataset-uuid",
    };

    expect(() => convertFileLayerToMapLayer(layerData)).toThrow(
      "Dataset layers cannot be converted as file layers",
    );
  });

  it("converts COG layer with local File blob", () => {
    const file = new File(["fake-tif-data"], "map.tif", { type: "image/tiff" });
    const layerData: SourceLayer = {
      data: file,
      humanId: "map.tif",
      isLoading: false,
      type: "cog",
      uuid: "cog-uuid",
    };

    const result = convertFileLayerToMapLayer(layerData);
    expect(result).toEqual({
      blob: file,
      format: "COG",
      displayName: "map.tif",
      isVisible: true,
      layerId: "map.tif",
      opacity: 1,
      uuid: "cog-uuid",
    });
  });

  it("converts COG layer with URL string", () => {
    const layerData: SourceLayer = {
      data: "https://example.com/data.tif",
      humanId: "https://example.com/data.tif",
      isLoading: false,
      type: "cog",
      uuid: "cog-url-uuid",
    };

    const result = convertFileLayerToMapLayer(layerData);
    expect(result).toEqual({
      url: "https://example.com/data.tif",
      format: "COG",
      displayName: "https://example.com/data.tif",
      isVisible: true,
      layerId: "https://example.com/data.tif",
      opacity: 1,
      uuid: "cog-url-uuid",
    });
  });

  it("throws for COG layer with invalid data", () => {
    const layerData: SourceLayer = {
      humanId: "bad-cog",
      isLoading: false,
      type: "cog",
      uuid: "bad-cog-uuid",
    };

    expect(() => convertFileLayerToMapLayer(layerData)).toThrow(
      "COG layer is missing file data or URL",
    );
  });

  it("passes KMZ binary data through", () => {
    const bytes = new Uint8Array([80, 75, 3, 4]);
    const layerData: SourceLayer = {
      data: bytes,
      humanId: "archive.kmz",
      isLoading: false,
      type: "kmz",
      uuid: "kmz-uuid",
    };

    const result = convertFileLayerToMapLayer(layerData);
    expect(result).toEqual({
      data: bytes,
      format: "KMZ",
      displayName: "archive.kmz",
      isVisible: true,
      layerId: "archive.kmz",
      opacity: 1,
      uuid: "kmz-uuid",
    });
  });

  it("passes GPX data through", () => {
    const layerData: SourceLayer = {
      data: "<gpx/>",
      humanId: "track.gpx",
      isLoading: false,
      type: "gpx",
      uuid: "gpx-uuid",
    };

    const result = convertFileLayerToMapLayer(layerData);
    expect(result).toEqual({
      data: "<gpx/>",
      format: "GPX",
      displayName: "track.gpx",
      isVisible: true,
      layerId: "track.gpx",
      opacity: 1,
      uuid: "gpx-uuid",
    });
  });

  it("uses humanId as displayName fallback", () => {
    const layerData: SourceLayer = {
      data: "<kml/>",
      humanId: "fallback-name",
      isLoading: false,
      type: "kml",
      uuid: "kml-uuid",
    };

    const result = convertFileLayerToMapLayer(layerData);
    expect(result.displayName).toBe("fallback-name");
  });
});
