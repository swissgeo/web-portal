import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import { describe, expect, it, vi } from "vitest";

import type { MapLibreStyle } from "../geoadminToMapLibreStyle";

import { applyOlTextBackground } from "../textBackgroundHelper";

function makeGlStyle(
  ...metadatas: (Record<string, unknown> | undefined)[]
): MapLibreStyle {
  return {
    version: 8,
    sources: {},
    layers: metadatas.map((metadata, i) => ({
      id: `l${i}`,
      type: "symbol",
      metadata,
    })),
  } as unknown as MapLibreStyle;
}

describe("applyOlTextBackground", () => {
  it("does nothing when no text-background config is present", () => {
    const layer = new VectorLayer({ source: new VectorSource() });
    const setStyleSpy = vi.spyOn(layer, "setStyle");

    applyOlTextBackground(layer, makeGlStyle(undefined));

    expect(setStyleSpy).not.toHaveBeenCalled();
  });

  it("does nothing when the layer has no base style function", () => {
    const layer = new VectorLayer({ source: new VectorSource() });
    vi.spyOn(layer, "getStyleFunction").mockReturnValue(undefined);
    const setStyleSpy = vi.spyOn(layer, "setStyle");

    applyOlTextBackground(
      layer,
      makeGlStyle({ "ol:text-background": { fill: "red" } }),
    );

    expect(setStyleSpy).not.toHaveBeenCalled();
  });

  it("applies fill, stroke and padding to every text style returned by the base style function", () => {
    const layer = new VectorLayer({ source: new VectorSource() });
    const text = new Text({ text: "hello" });
    const style = new Style({ text });
    vi.spyOn(layer, "getStyleFunction").mockReturnValue(() => [style]);

    applyOlTextBackground(
      layer,
      makeGlStyle({
        "ol:text-background": {
          fill: "rgba(0,0,0,0.5)",
          stroke: { color: "#fff", width: 2 },
          padding: [1, 2, 3, 4],
        },
      }),
    );

    const wrapped = layer.getStyle() as (
      feature: unknown,
      resolution: number,
    ) => unknown;
    const result = wrapped({}, 1);

    expect(result).toEqual([style]);
    expect(text.getBackgroundFill()).toBeInstanceOf(Fill);
    expect(text.getBackgroundFill()?.getColor()).toBe("rgba(0,0,0,0.5)");
    expect(text.getBackgroundStroke()).toBeInstanceOf(Stroke);
    expect(text.getBackgroundStroke()?.getColor()).toBe("#fff");
    expect(text.getBackgroundStroke()?.getWidth()).toBe(2);
    expect(text.getPadding()).toEqual([1, 2, 3, 4]);
  });

  it("skips styles without a text component and handles a single (non-array) style", () => {
    const layer = new VectorLayer({ source: new VectorSource() });
    const plainStyle = new Style();
    vi.spyOn(layer, "getStyleFunction").mockReturnValue(() => plainStyle);

    applyOlTextBackground(
      layer,
      makeGlStyle({ "ol:text-background": { fill: "red" } }),
    );

    const wrapped = layer.getStyle() as (
      feature: unknown,
      resolution: number,
    ) => unknown;

    expect(() => wrapped({}, 1)).not.toThrow();
    expect(wrapped({}, 1)).toBe(plainStyle);
  });

  it("passes through when the base style function returns nothing", () => {
    const layer = new VectorLayer({ source: new VectorSource() });
    vi.spyOn(layer, "getStyleFunction").mockReturnValue(() => undefined);

    applyOlTextBackground(
      layer,
      makeGlStyle({ "ol:text-background": { fill: "red" } }),
    );

    const wrapped = layer.getStyle() as (
      feature: unknown,
      resolution: number,
    ) => unknown;

    expect(wrapped({}, 1)).toBeUndefined();
  });

  it("uses the first declared config when multiple layers carry one", () => {
    const layer = new VectorLayer({ source: new VectorSource() });
    const text = new Text({ text: "hello" });
    const style = new Style({ text });
    vi.spyOn(layer, "getStyleFunction").mockReturnValue(() => [style]);

    applyOlTextBackground(
      layer,
      makeGlStyle(
        { "ol:text-background": { fill: "red" } },
        { "ol:text-background": { fill: "blue" } },
      ),
    );

    const wrapped = layer.getStyle() as (
      feature: unknown,
      resolution: number,
    ) => unknown;
    wrapped({}, 1);

    expect(text.getBackgroundFill()?.getColor()).toBe("red");
  });
});
