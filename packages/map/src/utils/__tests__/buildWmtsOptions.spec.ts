import type { WmtsEndpoint } from "@camptocamp/ogc-client";

import { describe, expect, it, vi } from "vitest";

import { buildWmtsOptions } from "../buildWmtsOptions";

const FAKE_TILE_GRID = { __tileGrid: true };

interface EndpointOverrides {
  crs?: string;
  matrixSets?: { identifier: string; crs: string }[];
  defaultStyle?: string;
  resourceLink?: { url: string; encoding: string; format: string } | null;
  dimensions?: Record<string, string>;
  layer?: unknown;
  tileGrid?: unknown;
}

function makeEndpoint(overrides: EndpointOverrides = {}) {
  const {
    crs = "urn:ogc:def:crs:EPSG:2056",
    matrixSets = [{ identifier: "2056_27", crs }],
    defaultStyle = "default",
    resourceLink = {
      url: "https://wmts.example/1.0.0/layer/default/{Time}/2056/{TileMatrix}/{TileCol}/{TileRow}.png",
      encoding: "REST",
      format: "image/png",
    },
    dimensions = { Time: "current" },
    layer = { matrixSets, defaultStyle },
    tileGrid = FAKE_TILE_GRID,
  } = overrides;

  return {
    getLayerByName: vi.fn(() => layer),
    getOpenLayersTileGrid: vi.fn(() => Promise.resolve(tileGrid)),
    getLayerResourceLink: vi.fn(() => resourceLink),
    getDefaultDimensions: vi.fn(() => dimensions),
  } as unknown as WmtsEndpoint;
}

describe("buildWmtsOptions", () => {
  it("assembles the OL WMTS options from the endpoint defaults", async () => {
    const endpoint = makeEndpoint();
    const options = await buildWmtsOptions(endpoint, "layer");

    expect(options).toEqual({
      urls: [
        "https://wmts.example/1.0.0/layer/default/{Time}/2056/{TileMatrix}/{TileCol}/{TileRow}.png",
      ],
      layer: "layer",
      matrixSet: "2056_27",
      format: "image/png",
      projection: "EPSG:2056",
      requestEncoding: "REST",
      tileGrid: FAKE_TILE_GRID,
      style: "default",
      dimensions: { Time: "current" },
    });
  });

  it.each([
    ["urn:ogc:def:crs:EPSG:2056", "EPSG:2056"],
    ["urn:ogc:def:crs:EPSG::2056", "EPSG:2056"],
    ["urn:ogc:def:crs:EPSG:6.18:3:2056", "EPSG:2056"],
    ["EPSG:2056", "EPSG:2056"],
    ["urn:ogc:def:crs:OGC:1.3:CRS84", "urn:ogc:def:crs:OGC:1.3:CRS84"],
  ])("simplifies the matrix-set CRS %s -> %s", async (crs, expected) => {
    const options = await buildWmtsOptions(makeEndpoint({ crs }), "layer");
    expect(options?.projection).toBe(expected);
  });

  it("honours config overrides", async () => {
    const endpoint = makeEndpoint({
      matrixSets: [
        { identifier: "2056_27", crs: "urn:ogc:def:crs:EPSG:2056" },
        { identifier: "2056_25", crs: "urn:ogc:def:crs:EPSG:2056" },
      ],
    });

    const options = await buildWmtsOptions(endpoint, "layer", {
      matrixSet: "2056_25",
      style: "custom",
      format: "image/jpeg",
      projection: "EPSG:21781",
      dimensions: { Time: "2020" },
      crossOrigin: "anonymous",
    });

    expect(options?.matrixSet).toBe("2056_25");
    expect(options?.style).toBe("custom");
    expect(options?.format).toBe("image/jpeg");
    expect(options?.projection).toBe("EPSG:21781");
    expect(options?.dimensions).toEqual({ Time: "2020" });
    expect(options?.crossOrigin).toBe("anonymous");
    // eslint-disable-next-line @typescript-eslint/unbound-method -- asserting on a vi.fn mock, not invoking it
    expect(endpoint.getLayerResourceLink).toHaveBeenCalledWith(
      "layer",
      "image/jpeg",
    );
  });

  it("returns null when the layer is not found", async () => {
    const endpoint = makeEndpoint({ layer: null });
    expect(await buildWmtsOptions(endpoint, "missing")).toBeNull();
  });

  it("returns null when the tile grid cannot be built", async () => {
    const endpoint = makeEndpoint({ tileGrid: null });
    expect(await buildWmtsOptions(endpoint, "layer")).toBeNull();
  });
});
