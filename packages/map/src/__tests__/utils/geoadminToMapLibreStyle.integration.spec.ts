import { Feature } from "ol";
import { stylefunction } from "ol-mapbox-style";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { describe, it, expect, vi } from "vitest";

import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import { geoadminToMapLibreStyle } from "@/utils/geoadminToMapLibreStyle";

/**
 * End-to-end (headless) check of the rendering path: convert a geoadmin style, apply
 * it to a real OpenLayers VectorLayer via ol-mapbox-style's `stylefunction`, then
 * evaluate the resulting style function against features. This validates the wiring
 * the composable uses, without booting a browser/map.
 */
const HYDROWEB_UNIQUE = {
  type: "unique",
  property: "grundwasser-class",
  values: [
    {
      geomType: "point",
      value: 2,
      vectorOptions: {
        type: "circle",
        radius: 8,
        fill: { color: "#808080" },
        stroke: { color: "#FFFFFF", width: 1 },
      },
    },
    {
      geomType: "point",
      value: 1,
      vectorOptions: {
        type: "triangle",
        radius: 12,
        rotation: 1.0471975511965976,
        fill: { color: "#808080" },
        stroke: { color: "#FFFFFF", width: 1 },
      },
    },
  ],
} as unknown as GeoAdminGeoJSONStyleDefinition;

function applyToLayer() {
  const { style, icons } = geoadminToMapLibreStyle(HYDROWEB_UNIQUE, "src");

  const circleFeature = new Feature({
    geometry: new Point([0, 0]),
    "grundwasser-class": 2,
  });
  const triangleFeature = new Feature({
    geometry: new Point([0, 0]),
    "grundwasser-class": 1,
  });

  const olLayer = new VectorLayer({
    source: new VectorSource({ features: [circleFeature, triangleFeature] }),
  });

  const getImage = vi.fn((_layer: unknown, name: string) => {
    const spec = icons.find((icon) => icon.name === name);
    // Return a minimally-valid canvas so ol-mapbox-style can build an icon style.
    if (!spec) {
      return undefined;
    }
    const canvas = document.createElement("canvas");
    canvas.width = spec.radius * 2;
    canvas.height = spec.radius * 2;
    return canvas;
  });

  stylefunction(
    olLayer,
    style,
    "src",
    undefined,
    undefined,
    undefined,
    undefined,
    getImage,
  );

  return { olLayer, circleFeature, triangleFeature, getImage };
}

describe("geoadminToMapLibreStyle - ol-mapbox-style integration", () => {
  it("applies a style function to the layer", () => {
    const { olLayer } = applyToLayer();
    expect(typeof olLayer.getStyleFunction()).toBe("function");
  });

  it("renders the circle class as a style with a circle image", () => {
    const { olLayer, circleFeature } = applyToLayer();
    const styleFn = olLayer.getStyleFunction()!;
    const result = styleFn(circleFeature, 10);
    const styles = Array.isArray(result) ? result : result ? [result] : [];
    expect(styles.length).toBeGreaterThan(0);
    // The circle layer produces an image (ol Circle) on the style.
    const hasImage = styles.some((style) => style.getImage() !== null);
    expect(hasImage).toBe(true);
  });

  it("resolves the generated icon for the triangle (symbol) class", () => {
    const { olLayer, triangleFeature, getImage } = applyToLayer();
    const styleFn = olLayer.getStyleFunction()!;
    styleFn(triangleFeature, 10);
    // ol-mapbox-style must ask our getImage for the triangle icon by name.
    expect(getImage).toHaveBeenCalled();
    const requestedNames = getImage.mock.calls.map((call) => call[1]);
    expect(requestedNames.some((name) => name.includes("triangle"))).toBe(true);
  });
});
