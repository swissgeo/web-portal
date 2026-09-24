import { describe, expect, it } from "vitest";

import { WEBMERCATOR } from "@/proj";
import { STANDARD_ZOOM_LEVEL_1_25000_MAP } from "@/proj/CoordinateSystem";

describe("WebMercatorCoordinateSystem", () => {
  describe("constructor", () => {
    it("has correct EPSG", () => {
      expect(WEBMERCATOR.epsg).to.eq("EPSG:3857");
    });

    it("uses mercator pyramid", () => {
      expect(WEBMERCATOR.usesMercatorPyramid).to.eq(true);
    });
  });

  describe("roundCoordinateValue", () => {
    it("rounds to 2 decimal places", () => {
      expect(WEBMERCATOR.roundCoordinateValue(1.23456)).to.eq(1.23);
      expect(WEBMERCATOR.roundCoordinateValue(1.23556)).to.eq(1.24);
    });
  });

  describe("getResolutionForZoom", () => {
    it.each([
      { zoom: 0, expected: 156368.08 },
      { zoom: 8.5, expected: 431.91 },
      { zoom: 18, expected: 0.6 },
    ])(
      "returns correct resolution value for valid zooms at equator (zoom=$zoom)",
      ({ zoom, expected }) => {
        const resolution = WEBMERCATOR.getResolutionForZoom(zoom, [0, 0]);
        expect(resolution).toBe(expected);
      },
    );

    it.each([
      { zoom: 0, expected: 78184.04 },
      { zoom: 8.5, expected: 215.95 },
      { zoom: 18, expected: 0.3 },
    ])(
      "returns correct resolution value for valid zooms at latitude 60° (zoom=$zoom)",
      ({ zoom, expected }) => {
        const LAT_60_DEG_IN_WEBMERCATOR = 8399737.88981836;
        const resolution = WEBMERCATOR.getResolutionForZoom(zoom, [
          0,
          LAT_60_DEG_IN_WEBMERCATOR,
        ]);
        expect(resolution).toBe(expected);
      },
    );
  });

  describe("getZoomForResolution", () => {
    it("returns zoom near 0 for the maximum resolution at equator", () => {
      const zoom = WEBMERCATOR.getZoomForResolution(156368.08, [0, 0]);
      expect(zoom).to.be.approximately(0, 0.01);
    });

    it("returns a zoom level for a given resolution at equator", () => {
      const zoom = WEBMERCATOR.getZoomForResolution(1000, [0, 0]);
      expect(zoom).to.be.greaterThan(0);
    });

    it("returns consistent results with getResolutionForZoom", () => {
      const resolution = WEBMERCATOR.getResolutionForZoom(8, [0, 0]);
      const zoom = WEBMERCATOR.getZoomForResolution(resolution, [0, 0]);
      expect(zoom).to.be.approximately(8, 0.01);
    });
  });

  describe("get1_25000ZoomLevel", () => {
    it("returns the standard 1:25000 zoom level", () => {
      expect(WEBMERCATOR.get1_25000ZoomLevel()).to.eq(
        STANDARD_ZOOM_LEVEL_1_25000_MAP,
      );
    });
  });

  describe("getDefaultZoom", () => {
    it("returns the standard default zoom", () => {
      expect(WEBMERCATOR.getDefaultZoom()).to.eq(
        STANDARD_ZOOM_LEVEL_1_25000_MAP,
      );
    });
  });
});
