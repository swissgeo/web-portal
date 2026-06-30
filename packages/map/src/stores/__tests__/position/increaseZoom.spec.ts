import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { createPinia, setActivePinia } from "pinia";
import { describe, it, expect } from "vitest";

import usePositionStore from "@/stores/position";

import increaseZoom from "../../position/actions/increaseZoom";

const pinia = createPinia();
setActivePinia(pinia); // Sets the active instance manually

const store = usePositionStore();

const mockDispatcher: ActionDispatcher = {
  name: "mockDispatcher",
};

describe("increaseZoom", () => {
  it("should increase the zoom level by 1", () => {
    const initialZoom = store.zoom;
    increaseZoom.call(store, mockDispatcher);
    expect(store.zoom).toBe(initialZoom + 1);
  });
});
