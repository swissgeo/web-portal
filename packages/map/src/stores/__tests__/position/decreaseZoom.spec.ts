import { describe, it, expect } from "vitest";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import decreaseZoom from "../../position/actions/decreaseZoom";

describe("decreaseZoom", () => {
  it("should decrease the zoom level by 1", () => {
    const initialZoom = positionStore.zoom;
    decreaseZoom.call(positionStore, mockDispatcher);
    expect(positionStore.zoom).toBe(initialZoom - 1);
  });
});
