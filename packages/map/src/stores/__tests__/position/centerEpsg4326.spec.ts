import { describe, it, expect } from "vitest";

import type { PositionStore } from "@/stores/position";

import centerEpsg4326 from "../../position/getters/centerEpsg4326";

const expected = [7.438632, 46.951083];

describe("centerEpsg4326", () => {
  it.each([
    {
      epsg: "EPSG:2056", // LV95
      center: [2600000, 1200000],
      expected,
    },
    {
      epsg: "EPSG:21781", // LV03
      center: [600000, 200000],
      expected,
    },
    {
      epsg: "EPSG:4326", // WGS84
      center: expected,
      expected,
    },
    {
      epsg: "EPSG:3857", // Web Mercator
      center: [828064.72, 5934093.22],
      expected,
    },
    {
      epsg: "EPSG:32632", // UTM

      center: [381188.78, 5200911.32],
      expected,
    },
  ])(
    "should return the center in EPSG:4326 coordinates for $epsg",
    ({ epsg, center, expected }) => {
      const store = {
        projection: {
          epsg,
        },
        center,
      } as unknown as PositionStore;

      const result = centerEpsg4326.call(store);
      expect(result[0]).toBeCloseTo(expected[0], 6);
      expect(result[1]).toBeCloseTo(expected[1], 6);
    },
  );
});
