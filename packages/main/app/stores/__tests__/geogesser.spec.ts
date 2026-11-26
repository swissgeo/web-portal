import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useGeogesserStore } from "../geogesser";

describe("geogesser store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("is closed at start, opens and closes", () => {
    const store = useGeogesserStore();
    expect(store.isOpen).toBe(false);
    store.open();
    expect(store.isOpen).toBe(true);
    store.close();
    expect(store.isOpen).toBe(false);
  });
});
