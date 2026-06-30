import { describe, it, expect } from "vitest";

import { positionStore } from "../__mocks__/stores";
import resolution from "../../position/getters/resolution";

describe("resolution", () => {
  it("should return the resolution for the current zoom and center", () => {
    positionStore.zoom = 3;
    positionStore.center = [0, 0];

    const result = resolution.call(positionStore);
    expect(result).toBe(100);
  });
});
