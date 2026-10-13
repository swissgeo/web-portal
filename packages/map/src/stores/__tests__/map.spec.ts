import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useMapStore } from "../map";

describe("useMapStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("does not pin a tile level by default", () => {
    expect(useMapStore().pinnedTileResolution).toBeNull();
  });

  it("holds the tile resolution to pin, and lets it go again", () => {
    const store = useMapStore();

    store.setPinnedTileResolution(2.5);
    expect(store.pinnedTileResolution).toBe(2.5);

    store.setPinnedTileResolution(null);
    expect(store.pinnedTileResolution).toBeNull();
  });
});
