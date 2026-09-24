import {
  computeNumberOfPixelsForPrint,
  getPageSizeInMeters,
  getPageSizeInPixels,
  getPrintExtent,
  isObject,
  validatePrintConfig,
} from "~/utils/printUtils";
import { describe, expect, it, vi } from "vitest";

describe("printUtils", () => {
  describe("page size conversions", () => {
    it("returns the expected A4 dimensions for both orientations", () => {
      expect(getPageSizeInMeters("a4", "landscape")).toEqual({
        width: 297,
        height: 210,
      });
      expect(getPageSizeInMeters("a4", "portrait")).toEqual({
        width: 210,
        height: 297,
      });
    });

    it("converts millimetres to pixels at the requested resolution", () => {
      expect(computeNumberOfPixelsForPrint(25.4, 300)).toBe(300);
      expect(getPageSizeInPixels("a4", "landscape", 254)).toEqual({
        width: 2970,
        height: 2100,
      });
      expect(getPageSizeInPixels("a4", "portrait", 254)).toEqual({
        width: 2100,
        height: 2970,
      });
    });

    it("can preserve fractional pixel dimensions", () => {
      const size = getPageSizeInPixels("a5", "landscape", 96, false);

      expect(size.width).toBeCloseTo((210 * 96) / 25.4);
      expect(size.height).toBeCloseTo((148 * 96) / 25.4);
    });
  });

  describe("validatePrintConfig", () => {
    it("accepts a supported print configuration", () => {
      expect(() =>
        validatePrintConfig({
          format: "a3",
          orientation: "portrait",
          resolution: 192,
        }),
      ).not.toThrow();
    });

    it.each([
      [null, "must be an object"],
      [[], "must be an object"],
      [
        { format: "letter", orientation: "portrait", resolution: 96 },
        "format must be one of",
      ],
      [
        { format: "a4", orientation: "upside-down", resolution: 96 },
        "orientation must be one of",
      ],
      [
        { format: "a4", orientation: "portrait", resolution: 0 },
        "resolution must be greater than 0",
      ],
      [
        { format: "a4", orientation: "portrait" },
        "resolution must be greater than 0",
      ],
    ])("rejects invalid config %#", (config, message) => {
      expect(() => validatePrintConfig(config)).toThrow(message);
    });
  });

  describe("getPrintExtent", () => {
    it("centres the extent and scales it with the zoom resolution", () => {
      const getResolutionForZoom = vi.fn().mockReturnValue(2);
      const map = {
        getView: () => ({ getResolutionForZoom }),
      };

      expect(
        getPrintExtent(map as never, 8, 100, 50, [2_600_000, 1_200_000]),
      ).toEqual([2_599_900, 1_199_950, 2_600_100, 1_200_050]);
      expect(getResolutionForZoom).toHaveBeenCalledWith(8);
    });

    it("returns null when the view has no resolution for the zoom", () => {
      const map = {
        getView: () => ({ getResolutionForZoom: () => undefined }),
      };

      expect(getPrintExtent(map as never, 8, 100, 50, [0, 0])).toBeNull();
    });
  });

  it.each([
    [{}, true],
    [new Date(), true],
    [null, false],
    [[], false],
    ["object", false],
  ])("identifies objects (%#)", (value, expected) => {
    expect(isObject(value)).toBe(expected);
  });
});
