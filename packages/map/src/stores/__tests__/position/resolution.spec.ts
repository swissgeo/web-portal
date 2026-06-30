import { createPinia, setActivePinia } from "pinia";
import { describe, it, expect } from "vitest";

import usePositionStore from "@/stores/position";

import resolution from "../../position/getters/resolution";

const pinia = createPinia();
setActivePinia(pinia); // Sets the active instance manually

const store = usePositionStore();

describe("resolution", () => {
  it("should return the resolution for the current zoom and center", () => {
    store.zoom = 3;
    store.center = [0, 0];

    const result = resolution.call(store);
    expect(result).toBe(100);
  });
});
