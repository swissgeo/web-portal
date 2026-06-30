import { describe, it, expect } from "vitest";

import { positionStore, mockDispatcher } from "../__mocks__/stores";
import increaseZoom from "../../position/actions/increaseZoom";

describe("increaseZoom", () => {
  it("should increase the zoom level by 1", () => {
    const initialZoom = positionStore.zoom;
    increaseZoom.call(positionStore, mockDispatcher);
    expect(positionStore.zoom).toBe(initialZoom + 1);
  });
});
