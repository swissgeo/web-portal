import log from "@swissgeo/log";
import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import type { Layer } from "@/index";

import { useLayerStore } from "@/stores/layer";

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

      expect(errorSpy).not.toHaveBeenCalled();
      expect(store.backgroundLayer?.info).toEqual(info);
      expect(store.backgroundLayer?.data).toEqual({ id: "dataset" });
    });

    it("getLayer resolves the background layer by uuid", () => {
      const store = useLayerStore();
      const bg = makeLayer("bg");
      store.setBackground(bg);

      expect(store.getLayer("bg")?.uuid).toBe("bg");
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("returns undefined for a uuid that matches no layer without logging", () => {
      const store = useLayerStore();
      store.addLayer(makeLayer("overlay"));
      store.setBackground(makeLayer("bg"));

      expect(store.getLayer("does-not-exist")).toBeUndefined();
      expect(errorSpy).not.toHaveBeenCalled();
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

  it("clears import options without consuming them", () => {
    const store = useLayerStore();
    store.addImportOption("failed-layer", { opacity: 0.4 });
    store.addImportOption("working-layer", { isVisible: false });

    store.clearImportOptions("failed-layer");

    expect(store.consumeImportOptions("failed-layer")).toBeUndefined();
    expect(store.consumeImportOptions("working-layer")).toEqual({
      isVisible: false,
    });
  });
});
