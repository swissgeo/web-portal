import { describe, expect, it } from "vitest";

import { WGS84 } from "@/proj";
import {
  PIXEL_LENGTH_IN_M_AT_ZOOM_ZERO_WITH_256PX_TILES,
  STANDARD_ZOOM_LEVEL_1_25000_MAP,
} from "@/proj/CoordinateSystem";

describe("WGS84CoordinateSystem", () => {
  describe("constructor", () => {
    it("has correct EPSG", () => {
      expect(WGS84.epsg).to.eq("EPSG:4326");
    });

    it("uses mercator pyramid", () => {
      expect(WGS84.usesMercatorPyramid).to.eq(true);
    });
  });

  describe("roundCoordinateValue", () => {
    it("rounds to 6 decimal places", () => {
      expect(WGS84.roundCoordinateValue(1.123456789)).to.eq(1.123457);
      expect(WGS84.roundCoordinateValue(1.123456123)).to.eq(1.123456);
    });
  });

  describe("getResolutionForZoom", () => {
    it("returns correct resolution for zoom 0 at equator", () => {
      const resolution = WGS84.getResolutionForZoom(0, [0, 0]);
      const expected =
        Math.round(
          PIXEL_LENGTH_IN_M_AT_ZOOM_ZERO_WITH_256PX_TILES * Math.cos(0) * 100,
        ) / 100;
      expect(resolution).to.eq(expected);
    });

    it("returns correct resolution for zoom 8", () => {
      const resolution = WGS84.getResolutionForZoom(8, [0, 0]);
      expect(resolution).to.be.greaterThan(0);
    });

    it("accounts for latitude deformation", () => {
      const resEquator = WGS84.getResolutionForZoom(5, [0, 0]);
      const resAt60 = WGS84.getResolutionForZoom(5, [0, 60]);
      expect(resEquator).to.be.greaterThan(resAt60);
    });
  });

  describe("getZoomForResolution", () => {
    it("returns a very small zoom for the max resolution", () => {
      const zoom = WGS84.getZoomForResolution(
        PIXEL_LENGTH_IN_M_AT_ZOOM_ZERO_WITH_256PX_TILES,
        [0, 0],
      );
      expect(zoom).to.eq(0);
    });

    it("returns a zoom level for a given resolution", () => {
      const zoom = WGS84.getZoomForResolution(1000, [0, 0]);
      expect(zoom).to.be.greaterThan(0);
    });

    it("accounts for latitude deformation", () => {
      const zoomEquator = WGS84.getZoomForResolution(1000, [0, 0]);
      const zoomAt60 = WGS84.getZoomForResolution(1000, [0, 60]);
      expect(zoomEquator).to.be.greaterThan(zoomAt60);
    });
  });

  describe("getExtentInOrderXY", () => {
    it("returns extent unchanged when already in X,Y order", () => {
      const extent: [number, number, number, number] = [5.0, 45.0, 10.0, 48.0];
      expect(WGS84.getExtentInOrderXY(extent)).to.deep.equal(extent);
    });

    it("swaps coordinates when in Y,X order", () => {
      const extent: [number, number, number, number] = [45.0, 5.0, 48.0, 10.0];
      const result = WGS84.getExtentInOrderXY(extent);
      expect(result).to.deep.equal([5.0, 45.0, 10.0, 48.0]);
    });
  });

  describe("get1_25000ZoomLevel", () => {
    it("returns the standard 1:25000 zoom level", () => {
      expect(WGS84.get1_25000ZoomLevel()).to.eq(
        STANDARD_ZOOM_LEVEL_1_25000_MAP,
      );
    });
  });

  describe("getDefaultZoom", () => {
    it("returns the standard default zoom", () => {
      expect(WGS84.getDefaultZoom()).to.eq(STANDARD_ZOOM_LEVEL_1_25000_MAP);
    });
  });
});
