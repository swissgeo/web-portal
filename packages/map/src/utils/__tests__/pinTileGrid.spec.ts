import TileGrid from "ol/tilegrid/TileGrid";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { describe, expect, it } from "vitest";

import { pinTileGrid } from "../pinTileGrid";

// the LV95 pyramid of swisstopo, reduced to a few levels
const resolutions = [10, 5, 2.5, 2, 1];
const matrixIds = ["20", "21", "22", "23", "25"];
const origin: [number, number] = [2420000, 1350000];

function makeWmtsGrid() {
  return new WMTSTileGrid({
    origin,
    resolutions,
    matrixIds,
    sizes: [
      [188, 125],
      [375, 250],
      [750, 500],
      [938, 625],
      [1875, 1250],
    ],
    tileSize: 256,
  });
}

describe("pinTileGrid", () => {
  it("keeps the tile level of the resolution whatever the resolution of the view", () => {
    const pinned = pinTileGrid(makeWmtsGrid(), 2.5);

    expect(pinned.getResolutions()).toEqual([2.5]);
    for (const viewResolution of [0.5, 2.5, 3.3, 6.6, 50]) {
      expect(pinned.getZForResolution(viewResolution)).toBe(0);
    }
  });

  it("requests the matrix of that level, with the same origin, tile size and extent of tiles", () => {
    const original = makeWmtsGrid();
    const pinned = pinTileGrid(original, 2.5);

    expect(pinned.getMatrixId(0)).toBe("22");
    expect(pinned.getOrigin(0)).toEqual(origin);
    expect(pinned.getTileSize(0)).toBe(256);
    expect(pinned.getFullTileRange(0)).toEqual(original.getFullTileRange(2));
  });

  it("finds the level of a resolution that is slightly off", () => {
    expect(pinTileGrid(makeWmtsGrid(), 2.5002).getMatrixId(0)).toBe("22");
  });

  it("leaves the grid as it is when it has no level for the resolution", () => {
    const grid = makeWmtsGrid();

    expect(pinTileGrid(grid, 3)).toBe(grid);
    expect(pinTileGrid(grid, 2.6)).toBe(grid);
  });

  it("leaves a grid as it is when it does not know the tile range of the level", () => {
    const grid = new WMTSTileGrid({ origin, resolutions, matrixIds });

    expect(pinTileGrid(grid, 2.5)).toBe(grid);
  });

  it("does nothing without a resolution to pin or without a grid", () => {
    const grid = makeWmtsGrid();

    expect(pinTileGrid(grid, null)).toBe(grid);
    expect(pinTileGrid(undefined, 2.5)).toBeUndefined();
  });

  it("also pins a plain tile grid, as the one of the WMS tiles", () => {
    const grid = new TileGrid({
      extent: [2420000, 1030000, 2900000, 1350000],
      origin,
      resolutions,
      tileSize: 512,
    });
    const pinned = pinTileGrid(grid, 5);

    expect(pinned.getResolutions()).toEqual([5]);
    expect(pinned.getTileSize(0)).toBe(512);
    expect(pinned.getOrigin(0)).toEqual(origin);
    expect(pinned.getExtent()).toEqual(grid.getExtent());
    expect(pinned.getZForResolution(50)).toBe(0);
  });
});
