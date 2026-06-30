import { describe, it, expect } from "vitest";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import setAutoRotation from "../../position/actions/setAutoRotation";

describe("setAutoRotation", () => {
  it("should set autoRotation to true", () => {
    setAutoRotation.call(positionStore, true, mockDispatcher);
    expect(positionStore.autoRotation).toBe(true);
  });

  it("should set autoRotation to false", () => {
    setAutoRotation.call(positionStore, false, mockDispatcher);
    expect(positionStore.autoRotation).toBe(false);
  });
});
