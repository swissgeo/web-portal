import { LinearRing } from "ol/geom";
import { describe, expect, it } from "vitest";

import { getLinearRingLength } from "@/utils/drawingUtils";

describe("getLinearRingLength", () => {
  it("calculates the perimeter of a closed linear ring in map units", () => {
    const ring = new LinearRing([
      [0, 0],
      [3, 0],
      [3, 4],
      [0, 4],
      [0, 0],
    ]);

    expect(getLinearRingLength(ring)).toBe(14);
  });

  it("sums each segment length without adding an implicit closing segment", () => {
    const ring = new LinearRing([
      [0, 0],
      [3, 4],
      [6, 4],
    ]);

    expect(getLinearRingLength(ring)).toBe(8);
  });
});
