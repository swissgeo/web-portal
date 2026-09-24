import {
  computeNumberOfPixelsForPrint,
  getPageSizeInPixels,
  getClosestScale,
  getPrintExtentForResolution,
  getResolutionForScale,
  getScaleForResolution,
  isObject,
  validatePrintConfig,
} from "~/utils/printUtils";
import { describe, expect, it } from "vitest";

describe("printUtils", () => {
  describe("page size conversions", () => {
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

  it.each([
    [{}, true],
    [new Date(), true],
    [null, false],
    [[], false],
    ["object", false],
  ])("identifies objects (%#)", (value, expected) => {
    expect(isObject(value)).toBe(expected);
  });

  describe("fixed scale", () => {
    // All rows of the table at https://docs.geo.admin.ch/visualize-data/wmts.html#gettile that have
    // a scale (the coarser levels have none, and level 24 is not served). The two coarsest rows are
    // about 1 above the exact value, the docs do not say why.
    it.each([
      [650, 2456694],
      [500, 1889765],
      [250, 944882],
      [100, 377953],
      [50, 188976],
      [20, 75591],
      [10, 37795],
      [5, 18898],
      [2.5, 9449],
      [2, 7559],
      [1, 3780],
      [0.5, 1890],
      [0.25, 945],
      [0.1, 378],
    ])(
      "gives the scale of the docs table at 96 dpi for %s m/px",
      (resolution, scale) => {
        expect(
          Math.abs(getScaleForResolution(resolution, 96) - scale),
        ).toBeLessThan(1.5);
      },
    );

    it("finds the closest round scale by ratio", () => {
      const scales = [10000, 25000, 50000, 100000];
      expect(getClosestScale(9449, scales)).toBe(10000);
      expect(getClosestScale(16000, scales)).toBe(25000);
      expect(getClosestScale(1000000, scales)).toBe(100000);
      expect(getClosestScale(1, scales)).toBe(10000);
    });

    // scales of the same docs table give back their resolution
    it.each([
      [9449, 2.5],
      [18898, 5],
      [3780, 1],
    ])("gives the resolution of 1:%s at 96 dpi", (scale, resolution) => {
      expect(getResolutionForScale(scale, 96)).toBeCloseTo(resolution, 2);
    });

    it("covers exactly the real-world size of the page at that scale", () => {
      const { width, height } = getPageSizeInPixels("a4", "landscape", 96);
      const [minX, minY, maxX, maxY] = getPrintExtentForResolution(
        getResolutionForScale(25000, 96),
        width,
        height,
        [2600000, 1200000],
      ) as [number, number, number, number];

      // A4 landscape is 297 x 210 mm
      expect(maxX - minX).toBeCloseTo(0.297 * 25000, -1);
      expect(maxY - minY).toBeCloseTo(0.21 * 25000, -1);
      expect((minX + maxX) / 2).toBe(2600000);
    });

    it("accepts the print scales the map can show, and only them", () => {
      const config = { format: "a4", orientation: "landscape", resolution: 96 };
      // at 96 dpi the map shows 0.1 to 650 m/px, which is 1:378 to 1:2'456'692
      for (const scale of [378, 25000, 2456692]) {
        expect(() => validatePrintConfig({ ...config, scale })).not.toThrow();
      }
      for (const scale of [377, 2456693, 3000000, 0, -1, Number.NaN]) {
        expect(() => validatePrintConfig({ ...config, scale })).toThrow(
          "the scales the map can show",
        );
      }
    });
  });
});
