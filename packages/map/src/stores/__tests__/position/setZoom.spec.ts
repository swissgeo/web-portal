import { describe, it, expect } from "vitest";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import setZoom from "../../position/actions/setZoom";

describe("setZoom", () => {
  it("should set zoom to a valid value", () => {
    const validZoom = 5;
    setZoom.call(positionStore, validZoom, mockDispatcher);
    expect(positionStore.zoom).toEqual(validZoom);
  });

  it("should not set zoom to an invalid value", () => {
    const invalidZoom = -1;
    setZoom.call(positionStore, invalidZoom, mockDispatcher);
    expect(positionStore.zoom).not.toEqual(invalidZoom);
  });
});
