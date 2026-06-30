import { describe, it, expect } from "vitest";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import setRotation from "../../position/actions/setRotation";

describe("setRotation (radians)", () => {
  it("should set rotation to a valid angle", () => {
    const validRotation = Math.PI / 4; // 45 degrees in radians
    setRotation.call(positionStore, validRotation, mockDispatcher);
    expect(positionStore.rotation).toEqual(validRotation);
  });

  it("should normalize rotation to a valid angle", () => {
    const invalidRotation = 10 * Math.PI; // 1800 degrees in radians
    setRotation.call(positionStore, invalidRotation, mockDispatcher);
    expect(positionStore.rotation).toEqual(invalidRotation % (2 * Math.PI));
  });

  it("should not set rotation to an invalid value", () => {
    const invalidRotation = NaN;
    setRotation.call(positionStore, invalidRotation, mockDispatcher);
    expect(positionStore.rotation).not.toEqual(invalidRotation);
  });
});
