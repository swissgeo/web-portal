import log from "@swissgeo/log";
import { setActivePinia, createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDimensionsStore } from "@/stores/dimensions";

describe("useDimensionsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("can update dimensions correctly with setDimensions", () => {
    it("creates a dimension on a layer with no prior entry", () => {
      const store = useDimensionsStore();

      store.setDimension("uuid-a", "time", {
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });

      expect(store.getDimensions("uuid-a")?.time).toEqual({
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });
      expect(store.getLayersWithDimension("time")).toEqual(["uuid-a"]);
    });

    it("merges a partial over an existing dimension", () => {
      const store = useDimensionsStore();
      store.setDimension("uuid-a", "time", {
        availableValues: [],
        currentValue: "1981",
      });

      store.setDimension("uuid-a", "time", {
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });

      expect(store.getDimensions("uuid-a")?.time).toEqual({
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });
    });

    it("preserves existing availableValues when only currentValue is provided", () => {
      const store = useDimensionsStore();
      store.setDimension("uuid-a", "time", {
        availableValues: ["2024"],
        currentValue: "2024",
      });

      store.setDimension("uuid-a", "time", { currentValue: "2025" });

      const dimension = store.getDimensions("uuid-a")?.time;
      expect(dimension?.availableValues).toEqual(["2024"]);
      expect(dimension?.currentValue).toBe("2025");
    });

    it("defaults availableValues to [] and currentValue to null when not provided", () => {
      const store = useDimensionsStore();

      store.setDimension("uuid-a", "time", { currentValue: "2024" });

      expect(store.getDimensions("uuid-a")?.time).toEqual({
        availableValues: [],
        currentValue: "2024",
      });
    });
  });

  describe("upsert layers with dimension in the store using setLayerDimensions", () => {
    it("sets a full record, overwriting any prior dimension", () => {
      const store = useDimensionsStore();
      store.setDimension("uuid-a", "time", { currentValue: "old" });

      store.setLayerDimensions("uuid-a", {
        time: { currentValue: "new", availableValues: ["new"] },
      });

      const dimension = store.getDimensions("uuid-a")?.time;
      expect(dimension?.currentValue).toBe("new");
      expect(dimension?.availableValues).toEqual(["new"]);
    });
  });

  describe("delete existing layers dimensions from the store using clearLayerDimensions", () => {
    it("removes the entry so the dimension is no longer present", () => {
      const store = useDimensionsStore();
      store.setDimension("uuid-a", "time", {
        availableValues: ["2024"],
        currentValue: "2024",
      });

      store.clearLayerDimensions("uuid-a");

      expect(store.getDimensions("uuid-a")?.time).toBeUndefined();
      expect(store.getDimensions("uuid-a")).toBeUndefined();
      expect(store.getLayersWithDimension("time")).not.toContain("uuid-a");
    });
  });

  describe("ensure getLayersWithDimension lists all layers with the given dimension", () => {
    it("lists only layers that possess the specified dimension", () => {
      const store = useDimensionsStore();
      store.setDimension("a", "time", {
        availableValues: ["2024"],
        currentValue: "2024",
      });
      store.setDimension("b", "time", {
        availableValues: ["2024"],
        currentValue: "2024",
      });

      expect(store.getLayersWithDimension("time")).toEqual(["a", "b"]);
    });
  });

  describe("getters on an unknown uuid", () => {
    it("return undefined without throwing or logging an error", () => {
      const store = useDimensionsStore();

      expect(store.getDimensions("missing")).toBeUndefined();
      expect(store.getDimensions("missing")?.time).toBeUndefined();
    });
  });

  describe("ensure using $reset fully reset the store", () => {
    it("clears all entries", () => {
      const store = useDimensionsStore();
      store.setDimension("a", "time", {
        availableValues: ["2024"],
        currentValue: "2024",
      });
      store.setDimension("b", "time", {
        availableValues: ["2024"],
        currentValue: "2024",
      });

      store.$reset();

      expect(store.dimensionsByLayer).toEqual({});
      expect(store.getLayersWithDimension("time")).toEqual([]);
    });
  });

  describe("logging is functional", () => {
    let debugSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      debugSpy = vi.spyOn(log, "debug").mockImplementation(() => undefined);
    });

    afterEach(() => {
      debugSpy.mockRestore();
    });

    it("logs via @swissgeo/log when setDimension is called", () => {
      const store = useDimensionsStore();

      store.setDimension("uuid-a", "time", { currentValue: "2024" });

      expect(debugSpy).toHaveBeenCalled();
    });
  });
});
