import { describe, expect, it } from "vitest";

import { LV95, WEBMERCATOR, WGS84 } from "@/proj";
import CoordinateSystemBounds from "@/proj/CoordinateSystemBounds";
import StandardCoordinateSystem from "@/proj/StandardCoordinateSystem";

class BoundlessCoordinateSystem extends StandardCoordinateSystem {
  constructor() {
    super({
      usesMercatorPyramid: false,
      proj4transformationMatrix: "test",
      label: "test",
      epsgNumber: 1234,
    });
  }
  getResolutionForZoom(): number {
    return 0;
  }

  getZoomForResolution(): number {
    return 0;
  }

  roundCoordinateValue(): number {
    return 0;
  }
}

describe("CoordinateSystem", () => {
  const coordinateSystemWithouBounds = new BoundlessCoordinateSystem();
  describe("getBoundsAs", () => {
    it("returns undefined if the bounds are not defined", () => {
      expect(coordinateSystemWithouBounds.getBoundsAs(WEBMERCATOR)).toBe(
        undefined,
      );
    });

    it("transforms LV95 into WebMercator correctly", () => {
      const result = LV95.getBoundsAs(WEBMERCATOR);
      expect(result).to.be.an.instanceOf(CoordinateSystemBounds);
      // numbers are coming from epsg.io's transform tool
      const acceptableDelta = 0.01;
      expect(result.lowerX).to.approximately(572215.44, acceptableDelta);
      expect(result.lowerY).to.approximately(5684416.96, acceptableDelta);
      expect(result.upperX).to.approximately(1277662.36, acceptableDelta);
      expect(result.upperY).to.approximately(6145307.39, acceptableDelta);
    });

    it("transforms LV95 into WGS84 correctly", () => {
      const result = LV95.getBoundsAs(WGS84);
      expect(result).to.be.an.instanceOf(CoordinateSystemBounds);
      // numbers are coming from epsg.io's transform tool
      const acceptableDelta = 0.0001;
      expect(result.lowerX).to.approximately(5.14029, acceptableDelta);
      expect(result.lowerY).to.approximately(45.39812, acceptableDelta);
      expect(result.upperX).to.approximately(11.47744, acceptableDelta);
      expect(result.upperY).to.approximately(48.23062, acceptableDelta);
    });
  });

  describe("isInBound", () => {
    it("returns false if no bounds are defined", () => {
      expect(coordinateSystemWithouBounds.isInBounds(0, 0)).toBe(false);
      expect(coordinateSystemWithouBounds.isInBounds(1, 1)).toBe(false);
    });
    // the remaining tests for this function are handled in the CoordinateSystemBounds.spec.ts file
  });

  describe("isInBounds with coordinate array", () => {
    it("returns true for a coordinate inside bounds", () => {
      expect(LV95.isInBounds([2660000, 1200000])).toBe(true);
    });

    it("returns false for a coordinate outside bounds", () => {
      expect(LV95.isInBounds([0, 0])).toBe(false);
    });
  });

  describe("getBoundsAs same EPSG", () => {
    it("returns bounds unchanged when target EPSG matches source", () => {
      const result = LV95.getBoundsAs(LV95);
      expect(result).toBe(LV95.bounds);
    });
  });

  describe("getBoundsAs with customCenter", () => {
    it("transforms the customCenter to the target coordinate system", () => {
      const result = WGS84.getBoundsAs(WEBMERCATOR);
      expect(result).to.be.an.instanceOf(CoordinateSystemBounds);
      expect(result.customCenter).toBeDefined();
    });
  });

  describe("roundZoomLevel", () => {
    it("rounds zoom to 3 decimal places", () => {
      expect(coordinateSystemWithouBounds.roundZoomLevel(1.23456)).to.eq(1.235);
      expect(coordinateSystemWithouBounds.roundZoomLevel(1.23444)).to.eq(1.234);
    });
  });

  describe("getResolutionSteps", () => {
    it("returns 21 resolution steps for a coordinate system with bounds", () => {
      const steps = WEBMERCATOR.getResolutionSteps();
      expect(steps).to.have.length(21);
    });

    it("returns empty array for a coordinate system without bounds", () => {
      const steps = coordinateSystemWithouBounds.getResolutionSteps();
      expect(steps).to.deep.equal([]);
    });

    it("returns decreasing resolutions with increasing zoom", () => {
      const steps = WEBMERCATOR.getResolutionSteps();
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i].resolution).to.be.lessThan(steps[i - 1].resolution);
      }
    });

    it("uses latitude to calculate resolution", () => {
      const stepsEquator = WEBMERCATOR.getResolutionSteps(0);
      const stepsHighLat = WEBMERCATOR.getResolutionSteps(60);
      expect(stepsEquator[0].resolution).to.be.greaterThan(
        stepsHighLat[0].resolution,
      );
    });
  });

  describe("getTileOrigin", () => {
    it("returns bounds topLeft for coordinate system with bounds", () => {
      expect(LV95.getTileOrigin()).to.deep.equal(LV95.bounds.topLeft);
    });

    it("returns [0, 0] for coordinate system without bounds", () => {
      expect(coordinateSystemWithouBounds.getTileOrigin()).to.deep.equal([
        0, 0,
      ]);
    });
  });

  describe("getMatrixIds", () => {
    it("returns sequential indices matching resolution steps", () => {
      const ids = WEBMERCATOR.getMatrixIds();
      const steps = WEBMERCATOR.getResolutionSteps();
      expect(ids).to.have.length(steps.length);
      ids.forEach((id, index) => {
        expect(id).to.eq(index);
      });
    });
  });

  describe("constructor", () => {
    it("sets properties correctly including technicalName", () => {
      expect(LV95.epsgNumber).to.eq(2056);
      expect(LV95.epsg).to.eq("EPSG:2056");
      expect(LV95.technicalName).to.eq("LV95");
      expect(LV95.usesMercatorPyramid).to.eq(false);
    });

    it("defaults usesMercatorPyramid to false", () => {
      const cs = new BoundlessCoordinateSystem();
      expect(cs.usesMercatorPyramid).to.eq(false);
    });
  });
});
