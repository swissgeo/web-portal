import TileGrid from "ol/tilegrid/TileGrid";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { describe, expect, it } from "vitest";

import {
  getLV95WMSTileGrid,
  getLV95WMTSTileGrid,
  getLV95ViewConfig,
} from "@/ol";
import { LV95 } from "@/proj";
import { LV95_RESOLUTIONS } from "@/proj/SwissCoordinateSystem";

describe("ol", () => {
  describe("getLV95WMSTileGrid", () => {
    it("returns a TileGrid instance", () => {
      const grid = getLV95WMSTileGrid();
      expect(grid).toBeInstanceOf(TileGrid);
    });

    it("uses 512 tile size", () => {
      const grid = getLV95WMSTileGrid();
      expect(grid.getTileSize(0)).toBe(512);
    });

    it("has resolutions matching LV95 resolution steps", () => {
      const grid = getLV95WMSTileGrid();
      const steps = LV95.getResolutionSteps();
      const expectedResolutions = steps.map((s) => s.resolution);
      expect(grid.getResolutions()).toEqual(expectedResolutions);
    });

    it("uses LV95 bounds as extent", () => {
      const grid = getLV95WMSTileGrid();
      expect(grid.getExtent()).toEqual(LV95.bounds.flatten);
    });

    it("uses LV95 tile origin", () => {
      const grid = getLV95WMSTileGrid();
      expect(grid.getOrigin(0)).toEqual(LV95.getTileOrigin());
    });
  });

  describe("getLV95WMTSTileGrid", () => {
    it("returns a WMTSTileGrid instance", () => {
      const grid = getLV95WMTSTileGrid();
      expect(grid).toBeInstanceOf(WMTSTileGrid);
    });

    it("uses default maxResolution of 0.25", () => {
      const grid = getLV95WMTSTileGrid();
      const resolutions = grid.getResolutions();
      expect(resolutions[resolutions.length - 1]).toBe(0.25);
    });

    it("truncates resolutions to match maxResolution", () => {
      const grid = getLV95WMTSTileGrid(0.25);
      const resolutions = grid.getResolutions();
      expect(resolutions).toContain(0.25);
      expect(resolutions).not.toContain(0.1);
    });

    it("includes all resolutions when maxResolution matches the last step", () => {
      const grid = getLV95WMTSTileGrid(0.1);
      const resolutions = grid.getResolutions();
      expect(resolutions[resolutions.length - 1]).toBe(0.1);
    });

    it("falls back to last index for non-matching maxResolution", () => {
      const grid = getLV95WMTSTileGrid(0.3);
      const resolutions = grid.getResolutions();
      expect(resolutions[resolutions.length - 1]).toBe(0.1);
      expect(resolutions.length).toBe(LV95.getResolutionSteps().length);
    });

    it("uses LV95 tile origin", () => {
      const grid = getLV95WMTSTileGrid();
      expect(grid.getOrigin(0)).toEqual(LV95.getTileOrigin());
    });

    it("has matrixIds as string indices", () => {
      const grid = getLV95WMTSTileGrid(0.25);
      const matrixIds = grid.getMatrixIds();
      expect(matrixIds[0]).toBe("0");
      expect(matrixIds[matrixIds.length - 1]).toBe(
        String(grid.getResolutions().length - 1),
      );
    });

    it("uses LV95 bounds as extent", () => {
      const grid = getLV95WMTSTileGrid();
      expect(grid.getExtent()).toEqual(LV95.bounds?.flatten);
    });
  });

  describe("getLV95ViewConfig", () => {
    it("returns an object with LV95 projection", () => {
      const config = getLV95ViewConfig();
      expect(config.projection).toBe(LV95.epsg);
    });

    it("centers on LV95 bounds center", () => {
      const config = getLV95ViewConfig();
      expect(config.center).toEqual(LV95.bounds.center);
    });

    it("uses LV95 default zoom", () => {
      const config = getLV95ViewConfig();
      expect(config.zoom).toBe(LV95.getDefaultZoom());
    });

    it("sets minResolution to the smallest LV95 resolution", () => {
      const config = getLV95ViewConfig();
      expect(config.minResolution).toBe(
        LV95_RESOLUTIONS[LV95_RESOLUTIONS.length - 1],
      );
    });

    it("includes all LV95 resolutions", () => {
      const config = getLV95ViewConfig();
      expect(config.resolutions).toEqual(LV95_RESOLUTIONS);
    });

    it("uses LV95 bounds as extent", () => {
      const config = getLV95ViewConfig();
      expect(config.extent).toEqual(LV95.bounds.flatten);
    });

    it("constrains only the center", () => {
      const config = getLV95ViewConfig();
      expect(config.constrainOnlyCenter).toBe(true);
    });
  });
});
