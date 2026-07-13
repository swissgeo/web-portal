import { describe, it, expect } from "vitest";

import { normalizeAngle } from "../normalizeAngle";

describe("normalizeAngle", () => {
  it("should normalize angles greater than PI", () => {
    expect(normalizeAngle(Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1);
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it("should normalize angles less than -PI", () => {
    expect(normalizeAngle(-Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1);
    expect(normalizeAngle(-3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it("should not change angles within the range -PI < angle <= PI", () => {
    expect(normalizeAngle(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
  });
});
