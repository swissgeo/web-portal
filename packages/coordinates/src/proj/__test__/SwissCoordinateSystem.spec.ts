import { describe, expect, it } from "vitest";

import { LV03, LV95 } from "@/proj";
import { SWISS_ZOOM_LEVEL_1_25000_MAP } from "@/proj/CoordinateSystem";
import {
  LV95_RESOLUTIONS,
  SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX,
  SWISSTOPO_MAX_ZOOM_LEVEL,
  SWISSTOPO_MIN_ZOOM_LEVEL,
} from "@/proj/SwissCoordinateSystem";

describe("Unit test functions from SwissCoordinateSystem", () => {
  describe("transformCustomZoomLevelToStandard", () => {
    it("transforms rounded value correctly", () => {
      // most zoom levels on mf-geoadmin3 were forced as integer, so we have to make sure we translate them correctly
      for (
        let swisstopoZoom = SWISSTOPO_MIN_ZOOM_LEVEL;
        swisstopoZoom <= SWISSTOPO_MAX_ZOOM_LEVEL;
        swisstopoZoom++
      ) {
        expect(LV95.transformCustomZoomLevelToStandard(swisstopoZoom)).to.eq(
          SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[swisstopoZoom],
        );
        expect(LV03.transformCustomZoomLevelToStandard(swisstopoZoom)).to.eq(
          SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[swisstopoZoom],
        );
      }
    });

    it("floors any floating swisstopo zoom given before searching for the equivalent", () => {
      for (
        let swisstopoZoom = SWISSTOPO_MIN_ZOOM_LEVEL;
        swisstopoZoom <= SWISSTOPO_MAX_ZOOM_LEVEL;
        swisstopoZoom++
      ) {
        for (
          let above = swisstopoZoom;
          above < swisstopoZoom + 1;
          above += 0.1
        ) {
          expect(LV95.transformCustomZoomLevelToStandard(above)).to.eq(
            SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[swisstopoZoom],
          );
          expect(LV03.transformCustomZoomLevelToStandard(above)).to.eq(
            SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[swisstopoZoom],
          );
        }
      }
    });
  });
  describe("transformStandardZoomLevelToCustom", () => {
    it("transforms exact value correctly", () => {
      SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX.forEach(
        (mercatorZoom, swisstopoZoom) => {
          expect(LV95.transformStandardZoomLevelToCustom(mercatorZoom)).to.eq(
            swisstopoZoom,
          );
          expect(LV03.transformStandardZoomLevelToCustom(mercatorZoom)).to.eq(
            swisstopoZoom,
          );
        },
      );
    });

    it("finds the closest swisstopo zoom from the mercator zoom given", () => {
      const acceptableDeltaInMercatorZoomLevel = 0.15;
      // generating ranges of mercator zoom that matches the steps of the matrix
      const rangeOfMercatorZoomToTest =
        SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX.map(
          (mercatorZoom, lv95Zoom) => {
            if (lv95Zoom === 0) {
              return {
                start: 0,
                end:
                  SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[0] -
                  acceptableDeltaInMercatorZoomLevel,
                expected: 0,
              };
            }
            if (lv95Zoom >= SWISSTOPO_MAX_ZOOM_LEVEL) {
              return {
                start: 21,
                end: 30,
                expected: lv95Zoom,
              };
            }
            const nextZoomLevel =
              SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[lv95Zoom + 1];
            return {
              start: mercatorZoom + acceptableDeltaInMercatorZoomLevel,
              end: nextZoomLevel,
              expected: lv95Zoom + 1,
            };
          },
        );
      rangeOfMercatorZoomToTest.forEach((range) => {
        for (
          let zoomLevel = range.start;
          zoomLevel <= range.end;
          zoomLevel += acceptableDeltaInMercatorZoomLevel
        ) {
          expect(LV95.transformStandardZoomLevelToCustom(zoomLevel)).to.eq(
            range.expected,
            `Mercator zoom ${zoomLevel} was not translated to LV95 correctly`,
          );
          expect(LV03.transformStandardZoomLevelToCustom(zoomLevel)).to.eq(
            range.expected,
            `Mercator zoom ${zoomLevel} was not translated to LV03 correctly`,
          );
        }
      });
    });
  });
  describe("getZoomForResolution", () => {
    it("returns zoom=0 if the resolution is too great", () => {
      expect(LV95.getZoomForResolution(LV95_RESOLUTIONS[0] + 1)).to.eq(0);
      expect(LV03.getZoomForResolution(LV95_RESOLUTIONS[0] + 1)).to.eq(0);
    });

    it("returns zoom correctly while resolution is exactly on a threshold", () => {
      for (let i = 0; i < LV95_RESOLUTIONS.length - 1; i++) {
        expect(LV95.getZoomForResolution(LV95_RESOLUTIONS[i])).to.eq(i);
        expect(LV03.getZoomForResolution(LV95_RESOLUTIONS[i])).to.eq(i);
      }
    });

    it("returns zoom correctly while resolution is in between the two thresholds", () => {
      for (let i = 0; i < LV95_RESOLUTIONS.length - 2; i++) {
        for (
          let resolution = LV95_RESOLUTIONS[i] - 1;
          resolution > LV95_RESOLUTIONS[i + 1];
          resolution--
        ) {
          expect(LV95.getZoomForResolution(resolution)).to.eq(
            i + 1,
            `resolution ${resolution} was misinterpreted`,
          );
          expect(LV03.getZoomForResolution(resolution)).to.eq(
            i + 1,
            `resolution ${resolution} was misinterpreted`,
          );
        }
      }
    });

    it("returns the max zoom available, event if the resolution is smaller than expected", () => {
      const smallestResolution = LV95_RESOLUTIONS[LV95_RESOLUTIONS.length - 1];
      expect(LV95.getZoomForResolution(smallestResolution - 0.1)).to.eq(
        LV95_RESOLUTIONS.indexOf(smallestResolution),
      );
      expect(LV03.getZoomForResolution(smallestResolution - 0.1)).to.eq(
        LV95_RESOLUTIONS.indexOf(smallestResolution),
      );
    });
  });

  describe("getResolutionForZoom", () => {
    it("returns correct resolution for integer zoom levels", () => {
      for (let i = 0; i < LV95_RESOLUTIONS.length; i++) {
        expect(LV95.getResolutionForZoom(i)).to.eq(LV95_RESOLUTIONS[i]);
      }
    });

    it("rounds zoom to nearest integer", () => {
      expect(LV95.getResolutionForZoom(0.4)).to.eq(LV95_RESOLUTIONS[0]);
      expect(LV95.getResolutionForZoom(0.6)).to.eq(LV95_RESOLUTIONS[1]);
    });

    it("returns 0 for zoom levels beyond available resolutions", () => {
      expect(LV95.getResolutionForZoom(100)).to.eq(0);
      expect(LV95.getResolutionForZoom(-100)).to.eq(0);
    });
  });

  describe("get1_25000ZoomLevel", () => {
    it("returns the Swiss 1:25000 zoom level", () => {
      expect(LV95.get1_25000ZoomLevel()).to.eq(SWISS_ZOOM_LEVEL_1_25000_MAP);
      expect(LV03.get1_25000ZoomLevel()).to.eq(SWISS_ZOOM_LEVEL_1_25000_MAP);
    });
  });

  describe("getDefaultZoom", () => {
    it("returns 1", () => {
      expect(LV95.getDefaultZoom()).to.eq(1);
      expect(LV03.getDefaultZoom()).to.eq(1);
    });
  });

  describe("roundZoomLevel", () => {
    it("rounds to closest swisstopo zoom level when normalize is true", () => {
      expect(LV95.roundZoomLevel(0.3, true)).to.eq(0);
      expect(LV95.roundZoomLevel(0.7, true)).to.eq(1);
    });

    it("rounds to 3 decimal places when normalize is false", () => {
      expect(LV95.roundZoomLevel(1.23456)).to.eq(1.235);
      expect(LV95.roundZoomLevel(1.23444)).to.eq(1.234);
    });
  });

  describe("roundCoordinateValue", () => {
    it("rounds to 2 decimal places", () => {
      expect(LV95.roundCoordinateValue(1.23456)).to.eq(1.23);
      expect(LV95.roundCoordinateValue(1.23556)).to.eq(1.24);
    });
  });

  describe("transformCustomZoomLevelToStandard out of range", () => {
    it("returns standard zoom level for 1:25000 map for out of range values", () => {
      expect(LV95.transformCustomZoomLevelToStandard(100)).to.eq(
        SWISSTOPO_TILEGRID_ZOOM_TO_STANDARD_ZOOM_MATRIX[8],
      );
    });
  });
});
