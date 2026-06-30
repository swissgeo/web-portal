import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { describe, it, expect } from "vitest";

import { positionStore } from "../__mocks__/stores";
import increaseZoom from "../../position/actions/increaseZoom";

const mockDispatcher: ActionDispatcher = {
  name: "mockDispatcher",
};

describe("increaseZoom", () => {
  it("should increase the zoom level by 1", () => {
    const initialZoom = positionStore.zoom;
    increaseZoom.call(positionStore, mockDispatcher);
    expect(positionStore.zoom).toBe(initialZoom + 1);
  });
});
