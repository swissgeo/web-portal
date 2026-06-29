import { DRAWING_LAYER_ID } from "@swissgeo/shared";
import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FOCUS_MODES, useDrawingStore } from "@/stores/drawing.store";

describe("drawing store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("exposes the supported focus modes", () => {
    expect(FOCUS_MODES).toEqual(["select", "create", "edit", "none"]);
  });

  it("initializes focus state", () => {
    const store = useDrawingStore();

    expect(store.focusMode).toBe("none");
    expect(store.focusedFeature).toBeNull();
  });

  it("creates a drawing vector layer linked to the drawing source", () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "12345678-1234-1234-1234-123456789012",
    );

    const store = useDrawingStore();

    expect(store.drawingVectorLayer.getSource()).toBe(
      store.drawingVectorSource,
    );
    expect(store.drawingVectorLayer.get("humanId")).toBe(DRAWING_LAYER_ID);
    expect(store.drawingVectorLayer.get("uuid")).toBe(
      "12345678-1234-1234-1234-123456789012",
    );
    expect(store.drawingVectorLayer.getStyle()).toBeNull();
  });

  it("starts with an empty drawing source that can receive features", () => {
    const store = useDrawingStore();
    const feature = new Feature(new Point([2600000, 1200000]));

    expect(store.drawingVectorSource.getFeatures()).toEqual([]);

    store.drawingVectorSource.addFeature(feature);

    expect(store.drawingVectorSource.getFeatures()).toEqual([feature]);
  });

  it("keeps map interactions inactive by default", () => {
    const store = useDrawingStore();

    expect(store.selectInteractions.getActive()).toBe(false);
    expect(store.modifyInteraction.getActive()).toBe(false);
    expect(store.snapInteraction.getActive()).toBe(false);
    expect(store.drawPointInteraction.getActive()).toBe(false);
    expect(store.drawLineStringInteraction.getActive()).toBe(false);
    expect(store.drawPolygonInteraction.getActive()).toBe(false);
    expect(store.drawCircleInteraction.getActive()).toBe(false);
  });

  it("configures the select interaction for single-feature selection", () => {
    const store = useDrawingStore();

    expect(store.selectInteractions.getFeatures().getLength()).toBe(0);
    expect(store.selectInteractions.getHitTolerance()).toBe(5);
    expect(store.selectInteractions.getStyle()).toBeNull();
  });

  it("creates draw interactions with sketch overlay sources", () => {
    const store = useDrawingStore();

    expect(store.drawPointInteraction.getOverlay().getSource()).toBeDefined();
    expect(
      store.drawLineStringInteraction.getOverlay().getSource(),
    ).toBeDefined();
    expect(store.drawPolygonInteraction.getOverlay().getSource()).toBeDefined();
    expect(store.drawCircleInteraction.getOverlay().getSource()).toBeDefined();
  });
});
