import { describe, expect, it } from "vitest";

import type { SingleCoordinate } from "@/coordinatesUtils";
import type { FlatExtent, NormalizedExtent } from "@/extentUtils";

import coordinatesUtils from "@/coordinatesUtils";
import {
  projExtent,
  normalizeExtent,
  flattenExtent,
  getExtentIntersectionWithCurrentProjection,
  getExtentCenter,
  createPixelExtentAround,
  createCutoutGeometry,
} from "@/extentUtils";
import { LV95, WGS84 } from "@/proj";

function expectExtentIs(
  toBeTested: FlatExtent,
  expected: FlatExtent,
  acceptableDelta = 0.5,
) {
  expect(toBeTested).to.be.an("Array").lengthOf(4);
  expected.forEach((value, index) => {
    expect(toBeTested[index]).to.be.approximately(value, acceptableDelta);
  });
}

describe("Test extent utils", () => {
  describe("projExtent", () => {
    it("reprojects a FlatExtent from WGS84 to LV95", () => {
      const extent: FlatExtent = [8.2, 47.5, 8.3, 47.6];
      const result = projExtent(WGS84, LV95, extent);
      expect(result).to.be.an("Array").lengthOf(4);
      expect(result[0]).to.be.within(2600000, 2700000);
      expect(result[1]).to.be.within(1100000, 1300000);
      expect(result[2]).to.be.within(2600000, 2700000);
      expect(result[3]).to.be.within(1100000, 1300000);
    });

    it("reprojects a NormalizedExtent from WGS84 to LV95", () => {
      const extent: NormalizedExtent = [
        [8.2, 47.5],
        [8.3, 47.6],
      ];
      const result = projExtent(WGS84, LV95, extent);
      expect(result).to.be.an("Array").lengthOf(2);
      expect(result[0]).to.have.lengthOf(2);
      expect(result[1]).to.have.lengthOf(2);
      expect(result[0][0]).to.be.within(2600000, 2700000);
      expect(result[0][1]).to.be.within(1100000, 1300000);
      expect(result[1][0]).to.be.within(2600000, 2700000);
      expect(result[1][1]).to.be.within(1100000, 1300000);
    });

    it("returns coordinates unchanged when projecting to the same system", () => {
      const extent: FlatExtent = [8.2, 47.5, 8.3, 47.6];
      const result = projExtent(WGS84, WGS84, extent);
      expect(result).to.be.an("Array").lengthOf(4);
      expect(result[0]).to.be.approximately(8.2, 0.0001);
      expect(result[1]).to.be.approximately(47.5, 0.0001);
      expect(result[2]).to.be.approximately(8.3, 0.0001);
      expect(result[3]).to.be.approximately(47.6, 0.0001);
    });

    it("returns NormalizedExtent unchanged when projecting to the same system", () => {
      const extent: NormalizedExtent = [
        [8.2, 47.5],
        [8.3, 47.6],
      ];
      const result = projExtent(WGS84, WGS84, extent);
      expect(result).to.be.an("Array").lengthOf(2);
      expect(result[0][0]).to.be.approximately(8.2, 0.0001);
      expect(result[0][1]).to.be.approximately(47.5, 0.0001);
      expect(result[1][0]).to.be.approximately(8.3, 0.0001);
      expect(result[1][1]).to.be.approximately(47.6, 0.0001);
    });
  });

  describe("normalizeExtent", () => {
    it("converts a FlatExtent to NormalizedExtent", () => {
      const extent: FlatExtent = [0, 0, 10, 10];
      const result = normalizeExtent(extent);
      expect(result).to.deep.equal([
        [0, 0],
        [10, 10],
      ]);
    });

    it("returns a NormalizedExtent unchanged", () => {
      const extent: NormalizedExtent = [
        [0, 0],
        [10, 10],
      ];
      const result = normalizeExtent(extent);
      expect(result).to.deep.equal([
        [0, 0],
        [10, 10],
      ]);
    });
  });

  describe("flattenExtent", () => {
    it("converts a NormalizedExtent to FlatExtent", () => {
      const extent: NormalizedExtent = [
        [0, 0],
        [10, 10],
      ];
      const result = flattenExtent(extent);
      expect(result).to.deep.equal([0, 0, 10, 10]);
    });

    it("returns a FlatExtent unchanged", () => {
      const extent: FlatExtent = [0, 0, 10, 10];
      const result = flattenExtent(extent);
      expect(result).to.deep.equal([0, 0, 10, 10]);
    });
  });

  describe("reproject and cut extent within projection bounds", () => {
    it("reproject extent of a single coordinate inside the bounds of the projection", () => {
      const singleCoordinate: SingleCoordinate = [8.2, 47.5];
      const singleCoordinateInLV95 = coordinatesUtils.reprojectAndRound(
        WGS84,
        LV95,
        singleCoordinate,
      );
      const extent = [singleCoordinate, singleCoordinate].flat() as FlatExtent;
      const result = getExtentIntersectionWithCurrentProjection(
        extent,
        WGS84,
        LV95,
      );
      expect(result).to.be.an("Array").lengthOf(4);
      expectExtentIs(result, [
        ...singleCoordinateInLV95,
        ...singleCoordinateInLV95,
      ]);
    });
    it("returns undefined if a single coordinate outside of bounds is given", () => {
      const singleCoordinateOutOfLV95Bounds = [8.2, 40];
      const extent = [
        singleCoordinateOutOfLV95Bounds,
        singleCoordinateOutOfLV95Bounds,
      ].flat() as FlatExtent;
      expect(
        getExtentIntersectionWithCurrentProjection(extent, WGS84, LV95),
      ).toBe(undefined);
    });
    it("returns undefined if the extent given is completely outside of the projection bounds", () => {
      const extent: FlatExtent = [-25.0, -20.0, -5.0, -45.0];
      expect(
        getExtentIntersectionWithCurrentProjection(extent, WGS84, LV95),
      ).toBe(undefined);
    });
    it("reproject and cut an extent that is greater than LV95 extent on all sides", () => {
      const result = getExtentIntersectionWithCurrentProjection(
        [-2.4, 35, 21.3, 51.7],
        WGS84,
        LV95,
      );
      expect(result).to.be.an("Array").lengthOf(4);
      expectExtentIs(result, [
        ...LV95.bounds.bottomLeft,
        ...LV95.bounds.topRight,
      ]);
    });
    it("reproject and cut an extent that is partially bigger than LV95 bounds", () => {
      const result = getExtentIntersectionWithCurrentProjection(
        // extent of file linked to PB-1221
        [-122.08, -33.85, 151.21, 51.5],
        WGS84,
        LV95,
      );
      expect(result).to.be.an("Array").lengthOf(4);
      expectExtentIs(result, [
        ...LV95.bounds.bottomLeft,
        ...LV95.bounds.topRight,
      ]);
    });
    it("only gives back the portion of an extent that is within LV95 bounds", () => {
      const singleCoordinateInsideLV95: SingleCoordinate = [7.54, 48.12];
      const singleCoordinateInLV95 = coordinatesUtils.reprojectAndRound(
        WGS84,
        LV95,
        singleCoordinateInsideLV95,
      );
      const overlappingExtent: FlatExtent = [
        0,
        0,
        ...singleCoordinateInsideLV95,
      ];
      const result = getExtentIntersectionWithCurrentProjection(
        overlappingExtent,
        WGS84,
        LV95,
      );
      expect(result).to.be.an("Array").lengthOf(4);
      expectExtentIs(result, [
        ...LV95.bounds.bottomLeft,
        ...singleCoordinateInLV95,
      ]);
    });
    it("does not reproject when extent and current projection share the same EPSG", () => {
      const extent: FlatExtent = [8.0, 47.0, 9.0, 48.0];
      const result = getExtentIntersectionWithCurrentProjection(
        extent,
        WGS84,
        WGS84,
      );
      expect(result).to.be.an("Array").lengthOf(4);
      expect(result[0]).to.be.approximately(8.0, 0.1);
      expect(result[1]).to.be.approximately(47.0, 0.1);
      expect(result[2]).to.be.approximately(9.0, 0.1);
      expect(result[3]).to.be.approximately(48.0, 0.1);
    });

    it("accepts a NormalizedExtent input", () => {
      const extent: NormalizedExtent = [
        [7.5, 47.0],
        [8.5, 48.0],
      ];
      const result = getExtentIntersectionWithCurrentProjection(
        extent,
        WGS84,
        LV95,
      );
      expect(result).to.be.an("Array").lengthOf(4);
      expect(result[0]).to.be.within(2400000, 2900000);
      expect(result[1]).to.be.within(1000000, 1400000);
    });

    it("returns undefined for an extent with invalid length", () => {
      const extent = [1, 2, 3] as unknown as FlatExtent;
      expect(
        getExtentIntersectionWithCurrentProjection(extent, WGS84, LV95),
      ).toBe(undefined);
    });

    it("returns undefined when currentProjection has no bounds", () => {
      const noBoundsProj = {
        ...LV95,
        bounds: undefined,
      } as unknown as typeof LV95;
      expect(
        getExtentIntersectionWithCurrentProjection(
          [8.0, 47.0, 9.0, 48.0],
          WGS84,
          noBoundsProj,
        ),
      ).toBe(undefined);
    });
  });

  describe("getExtentCenter", () => {
    it("calculates the center of a FlatExtent", () => {
      const extent: FlatExtent = [0, 0, 30, 70];
      const center = getExtentCenter(extent);
      expect(center).to.be.an("Array").lengthOf(2);
      expect(center[0]).to.be.closeTo(15, 0.0001);
      expect(center[1]).to.be.closeTo(35, 0.0001);
    });

    it("calculates the center of a NormalizedExtent", () => {
      const extent: NormalizedExtent = [
        [0, 0],
        [30, 70],
      ];
      const center = getExtentCenter(extent);
      expect(center).to.be.an("Array").lengthOf(2);
      expect(center[0]).to.be.closeTo(15, 0.0001);
      expect(center[1]).to.be.closeTo(35, 0.0001);
    });
  });

  describe("createPixelExtentAround", () => {
    it("creates an extent around a WGS84 coordinate", () => {
      const result = createPixelExtentAround({
        size: 100,
        coordinate: [8.2, 47.5],
        projection: WGS84,
        resolution: 500,
      });
      expect(result).to.be.an("Array").lengthOf(4);
      expect(result![0]).to.be.lessThan(8.2);
      expect(result![1]).to.be.lessThan(47.5);
      expect(result![2]).to.be.greaterThan(8.2);
      expect(result![3]).to.be.greaterThan(47.5);
    });

    it("creates an extent around an LV95 coordinate", () => {
      const result = createPixelExtentAround({
        size: 100,
        coordinate: [2660000, 1200000],
        projection: LV95,
        resolution: 500,
      });
      expect(result).to.be.an("Array").lengthOf(4);
      expect(result![0]).to.be.lessThan(2660000);
      expect(result![1]).to.be.lessThan(1200000);
      expect(result![2]).to.be.greaterThan(2660000);
      expect(result![3]).to.be.greaterThan(1200000);
    });

    it("rounds values when rounded option is true", () => {
      const result = createPixelExtentAround({
        size: 100,
        coordinate: [8.2, 47.5],
        projection: WGS84,
        resolution: 500,
        rounded: true,
      });
      expect(result).to.be.an("Array").lengthOf(4);
      result!.forEach((value) => {
        expect(value).to.equal(Math.round(value));
      });
    });

    it("returns undefined when size is 0", () => {
      expect(
        createPixelExtentAround({
          size: 0,
          coordinate: [8.2, 47.5],
          projection: WGS84,
          resolution: 500,
        }),
      ).toBe(undefined);
    });

    it("returns undefined when resolution is 0", () => {
      expect(
        createPixelExtentAround({
          size: 100,
          coordinate: [8.2, 47.5],
          projection: WGS84,
          resolution: 0,
        }),
      ).toBe(undefined);
    });

    it("returns undefined when coordinate is undefined", () => {
      expect(
        createPixelExtentAround({
          size: 100,
          coordinate: undefined as unknown as SingleCoordinate,
          projection: WGS84,
          resolution: 500,
        }),
      ).toBe(undefined);
    });

    it("returns undefined when projection is undefined", () => {
      expect(
        createPixelExtentAround({
          size: 100,
          coordinate: [8.2, 47.5],
          projection: undefined as unknown as typeof WGS84,
          resolution: 500,
        }),
      ).toBe(undefined);
    });
  });

  describe("createCutoutGeometry", () => {
    it("creates a polygon with a hole from two overlapping extents", () => {
      const outerExtent = [2420000, 1030000, 2900000, 1350000];
      const innerExtent = [2600000, 1150000, 2700000, 1250000];
      const result = createCutoutGeometry(outerExtent, innerExtent);
      expect(result).not.toBeNull();
      const coords = result!.getCoordinates();
      expect(coords).to.have.lengthOf(2);
      expect(coords[0]).to.have.length.greaterThan(0);
      expect(coords[1]).to.have.length.greaterThan(0);
    });
  });
});
