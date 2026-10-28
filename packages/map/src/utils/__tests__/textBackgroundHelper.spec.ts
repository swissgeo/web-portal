import type { StyleSpecification } from "mapbox-gl";

import { describe, expect, it, vi } from "vitest";

import { applyOlTextBackground } from "../textBackgroundHelper";

function makeStyleWithMetadata(metadata: unknown): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: "label", type: "symbol", metadata }],
  } as unknown as StyleSpecification;
}

function makeOlLayer(baseStyle: (_resolution: number) => unknown[]) {
  const setStyle = vi.fn();
  const layer = {
    getStyleFunction: vi.fn(() => baseStyle),
    setStyle,
  };
  return {
    layer: layer as unknown as Parameters<typeof applyOlTextBackground>[0],
    setStyle,
  };
}

function makeStyleWithText() {
  const text = {
    setBackgroundFill: vi.fn(),
    setBackgroundStroke: vi.fn(),
    setPadding: vi.fn(),
  };
  return { text, getText: () => text };
}

describe("applyOlTextBackground", () => {
  it("does nothing when no layer carries the metadata key", () => {
    const { layer, setStyle } = makeOlLayer(() => []);
    applyOlTextBackground(layer, makeStyleWithMetadata(undefined));
    expect(setStyle).not.toHaveBeenCalled();
  });

  it("wraps the style function and applies fill, stroke and padding", () => {
    const styleWithText = makeStyleWithText();
    const base = vi.fn(() => [styleWithText as never]);
    const { layer, setStyle } = makeOlLayer(base);

    applyOlTextBackground(
      layer,
      makeStyleWithMetadata({
        "ol:text-background": {
          fill: "rgba(14,80,114,0.9)",
          stroke: { color: "#000000", width: 1 },
          padding: [2, 2, 2, 2],
        },
      }),
    );

    expect(setStyle).toHaveBeenCalledTimes(1);
    const wrapped = setStyle.mock.calls[0]![0] as (
      _feature: unknown,
      _resolution: number,
    ) => unknown;
    const result = wrapped({}, 1);

    expect(base).toHaveBeenCalledWith({}, 1);
    const fill = styleWithText.text.setBackgroundFill.mock.calls[0]![0];
    expect(fill.getColor()).toBe("rgba(14,80,114,0.9)");
    const stroke = styleWithText.text.setBackgroundStroke.mock.calls[0]![0];
    expect(stroke.getColor()).toBe("#000000");
    expect(stroke.getWidth()).toBe(1);
    expect(styleWithText.text.setPadding).toHaveBeenCalledWith([2, 2, 2, 2]);
    expect(result).toEqual([styleWithText]);
  });

  it("skips styles without text", () => {
    const withoutText = { getText: (): null => null };
    const base = vi.fn(() => [withoutText as never]);
    const { layer, setStyle } = makeOlLayer(base);

    applyOlTextBackground(
      layer,
      makeStyleWithMetadata({
        "ol:text-background": { fill: "red" },
      }),
    );
    const wrapped = setStyle.mock.calls[0]![0] as (
      _feature: unknown,
      _resolution: number,
    ) => unknown;
    expect(() => wrapped({}, 1)).not.toThrow();
  });

  it("applies only the fill when stroke and padding are absent", () => {
    const styleWithText = makeStyleWithText();
    const { layer, setStyle } = makeOlLayer(
      vi.fn(() => [styleWithText as never]),
    );

    applyOlTextBackground(
      layer,
      makeStyleWithMetadata({
        "ol:text-background": { fill: "rgba(14,80,114,0.9)" },
      }),
    );
    const wrapped = setStyle.mock.calls[0]![0] as (
      _feature: unknown,
      _resolution: number,
    ) => unknown;
    wrapped({}, 1);

    expect(styleWithText.text.setBackgroundFill).toHaveBeenCalled();
    expect(styleWithText.text.setBackgroundStroke).not.toHaveBeenCalled();
    expect(styleWithText.text.setPadding).not.toHaveBeenCalled();
  });

  it("does nothing when the layer has no style function", () => {
    const setStyle = vi.fn();
    const layer = {
      getStyleFunction: vi.fn(() => null),
      setStyle,
    } as unknown as Parameters<typeof applyOlTextBackground>[0];
    applyOlTextBackground(
      layer,
      makeStyleWithMetadata({ "ol:text-background": { fill: "red" } }),
    );
    expect(setStyle).not.toHaveBeenCalled();
  });
});
