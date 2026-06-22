import log from "@swissgeo/log";
import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import type { Layer } from "@/index";

import { useLayerStore } from "../layer";

function makeLayer(id: string): Layer {
  return {
    uuid: id,
    humanId: id,
    type: "dataset",
    isLoading: false,
  };
}

describe("Layer store helpers", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("setDimension", () => {
    it("sets availableValues and currentValue on a layer with no existing dimension", () => {
      const store = useLayerStore();
      store.addLayer(makeLayer("a"));

      store.setDimension("time", "a", {
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });

      expect(store.layers[0].dimensions?.time).toEqual({
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });
    });

    it("overwrites currentValue when explicitly set via setDimension", () => {
      const store = useLayerStore();
      store.addLayer({
        ...makeLayer("a"),
        dimensions: { time: { availableValues: [], currentValue: "1981" } },
      });

      store.setDimension("time", "a", {
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });

      expect(store.layers[0].dimensions?.time).toEqual({
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });
    });
  });

  describe("background layer resolution (GPS-792)", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(log, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it("does not log 'Incorrect uuid' when operating on the background layer", () => {
      const store = useLayerStore();
      store.addLayer(makeLayer("overlay"));
      store.setBackground(makeLayer("bg"));

      const info = { displayName: "Background", abstract: "abstract" };
      store.setLayerInfo("bg", info);
      store.setLayerData("bg", { id: "dataset" } as never);
      store.setDimension("time", "bg", {
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(store.backgroundLayer?.info).toEqual(info);
      expect(store.backgroundLayer?.data).toEqual({ id: "dataset" });
      expect(store.backgroundLayer?.dimensions?.time).toEqual({
        availableValues: ["1981", "2024"],
        currentValue: "2024",
      });
    });

    it("getLayer resolves the background layer by uuid", () => {
      const store = useLayerStore();
      const bg = makeLayer("bg");
      store.setBackground(bg);

      expect(store.getLayer("bg")?.uuid).toBe("bg");
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("still logs an error for a uuid that matches no layer", () => {
      const store = useLayerStore();
      store.addLayer(makeLayer("overlay"));
      store.setBackground(makeLayer("bg"));

      expect(store.getLayer("does-not-exist")).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        "Incorrect uuid given : does-not-exist",
      );
    });
  });

  it("replaces a layer in place", () => {
    const store = useLayerStore();
    store.addLayer(makeLayer("a"));
    store.addLayer(makeLayer("b"));

    const replacement = makeLayer("replacement");
    store.replaceLayer("a", replacement);

    expect(store.layers.map((l) => l.uuid)).toEqual(["replacement", "b"]);

    // unknown uuid: no-op
    store.replaceLayer("missing", makeLayer("c"));
    expect(store.layers.map((l) => l.uuid)).toEqual(["replacement", "b"]);
  });
});
