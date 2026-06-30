import type { ActionDispatcher } from "@swissgeo/shared/action-dispatcher";

import { createPinia, setActivePinia } from "pinia";
import { describe, it, expect } from "vitest";

import usePositionStore from "@/stores/position";

import decreaseZoom from "../../position/actions/decreaseZoom";

const pinia = createPinia();
setActivePinia(pinia); // Sets the active instance manually

const store = usePositionStore();

const mockDispatcher: ActionDispatcher = {
  name: "mockDispatcher",
};

describe("decreaseZoom", () => {
  it("should decrease the zoom level by 1", () => {
    const initialZoom = store.zoom;
    decreaseZoom.call(store, mockDispatcher);
    expect(store.zoom).toBe(initialZoom - 1);
  });
});
