import { describe, it, expect } from "vitest";

import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import {
  geoadminToMapLibreStyle,
  labelTemplateToExpression,
  parseCssFont,
} from "@/utils/geoadminToMapLibreStyle";
import { makeGetImage } from "@/utils/maplibreShapeIcons";

// The real geoadmin style for ch.bafu.hydroweb-messstationen_grundwasser. `rotation`
// is present in real data but absent from the exported type, so we cast the literal.
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
    {
      geomType: "point",
      value: 3,
      vectorOptions: {
        type: "square",
        radius: 10,
        rotation: 0.7853981633974483,
        fill: { color: "#808080" },
        stroke: { color: "#FFFFFF", width: 1 },
      },
    },
  ],
} as unknown as GeoAdminGeoJSONStyleDefinition;

describe("geoadminToMapLibreStyle - unique (hydroweb grundwasser)", () => {
  const { style, icons } = geoadminToMapLibreStyle(HYDROWEB_UNIQUE, "src");

  it("produces a valid MapLibre style shell with one geojson source", () => {
    expect(style.version).toBe(8);
    expect(Object.keys(style.sources)).toEqual(["src"]);
    expect(style.sources.src!.type).toBe("geojson");
  });

  it("emits one layer per unique value, all bound to the source", () => {
    expect(style.layers).toHaveLength(3);
    style.layers.forEach((layer) => {
      expect(layer.source).toBe("src");
    });
  });

  it("filters each layer by the discriminating property and value (type-tolerant)", () => {
    expect(style.layers[0]!.filter).toEqual([
      "==",
      ["to-string", ["get", "grundwasser-class"]],
      "2",
    ]);
    expect(style.layers[1]!.filter).toEqual([
      "==",
      ["to-string", ["get", "grundwasser-class"]],
      "1",
    ]);
    expect(style.layers[2]!.filter).toEqual([
      "==",
      ["to-string", ["get", "grundwasser-class"]],
      "3",
    ]);
  });

  it("maps a circle shape to a native circle layer", () => {
    const circle = style.layers[0]!;
    expect(circle.type).toBe("circle");
    expect(circle.paint).toMatchObject({
      "circle-radius": 8,
      "circle-color": "#808080",
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 1,
    });
  });

  it("maps non-circle shapes to symbol layers with generated icons", () => {
    const triangle = style.layers[1]!;
    const square = style.layers[2]!;
    expect(triangle.type).toBe("symbol");
    expect(square.type).toBe("symbol");
    expect(triangle.layout!["icon-image"]).toBeTypeOf("string");
    expect(triangle.layout!["icon-rotation-alignment"]).toBe("map");
  });

  it("converts geoadmin rotation (radians) to MapLibre icon-rotate (degrees)", () => {
    const triangle = style.layers[1]!;
    const square = style.layers[2]!;
    expect(triangle.layout!["icon-rotate"]).toBeCloseTo(60, 5);
    expect(square.layout!["icon-rotate"]).toBeCloseTo(45, 5);
  });

  it("collects one icon spec per distinct non-circle shape", () => {
    expect(icons).toHaveLength(2);
    const shapes = icons.map((icon) => icon.shape).sort();
    expect(shapes).toEqual(["square", "triangle"]);
    const triangleIcon = icons.find((icon) => icon.shape === "triangle")!;
    expect(triangleIcon).toMatchObject({
      radius: 12,
      fillColor: "#808080",
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
    });
    // The symbol layer references the icon by its generated name.
    expect(style.layers[1]!.layout!["icon-image"]).toBe(triangleIcon.name);
  });
});

describe("geoadminToMapLibreStyle - range", () => {
  const RANGE: GeoAdminGeoJSONStyleDefinition = {
    type: "range",
    property: "value",
    ranges: [
      {
        geomType: "polygon",
        range: [0, 10],
        vectorOptions: {
          type: "square",
          fill: { color: "#ff0000" },
          stroke: { color: "#000000", width: 2 },
        },
      },
    ],
  };

  it("emits a half-open range filter and fill + outline layers for polygons", () => {
    const { style } = geoadminToMapLibreStyle(RANGE, "src");
    const fill = style.layers.find((layer) => layer.type === "fill")!;
    const outline = style.layers.find((layer) => layer.type === "line")!;
    expect(fill.filter).toEqual([
      "all",
      [">=", ["to-number", ["get", "value"]], 0],
      ["<", ["to-number", ["get", "value"]], 10],
    ]);
    expect(fill.paint).toMatchObject({ "fill-color": "#ff0000" });
    expect(outline.paint).toMatchObject({
      "line-color": "#000000",
      "line-width": 2,
    });
  });
});

describe("geoadminToMapLibreStyle - single line", () => {
  const SINGLE: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "line",
    vectorOptions: {
      type: "square",
      fill: { color: "#000000" },
      stroke: { color: "#0000ff", width: 3 },
    },
  };

  it("emits a single unfiltered line layer", () => {
    const { style } = geoadminToMapLibreStyle(SINGLE, "src");
    expect(style.layers).toHaveLength(1);
    const line = style.layers[0]!;
    expect(line.type).toBe("line");
    expect(line.filter).toBeUndefined();
    expect(line.paint).toMatchObject({
      "line-color": "#0000ff",
      "line-width": 3,
    });
  });
});

describe("geoadminToMapLibreStyle - resolutionToZoom", () => {
  it("maps min/maxResolution to inverse maxzoom/minzoom when supplied", () => {
    const def: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "n/a",
      geomType: "point",
      minResolution: 2,
      maxResolution: 100,
      vectorOptions: {
        type: "circle",
        radius: 5,
        fill: { color: "#808080" },
        stroke: { color: "#fff", width: 1 },
      },
    };
    // Fake mapping: zoom = 20 - log2(resolution)-ish; just needs to be monotonic.
    const resolutionToZoom = (res: number) => 20 - Math.log2(res);
    const { style } = geoadminToMapLibreStyle(def, "src", { resolutionToZoom });
    const circle = style.layers[0]!;
    // minResolution (2) -> maxzoom; maxResolution (100) -> minzoom.
    expect(circle.maxzoom).toBeCloseTo(20 - Math.log2(2), 5);
    expect(circle.minzoom).toBeCloseTo(20 - Math.log2(100), 5);
  });
});

describe("labelTemplateToExpression", () => {
  it("returns a bare get for a single token", () => {
    expect(labelTemplateToExpression("${name}")).toEqual(["get", "name"]);
  });

  it("builds a concat for mixed templates", () => {
    expect(labelTemplateToExpression("${name} (${code})")).toEqual([
      "concat",
      ["get", "name"],
      " (",
      ["get", "code"],
      ")",
    ]);
  });

  it("returns the literal string when there are no tokens", () => {
    expect(labelTemplateToExpression("static")).toBe("static");
  });
});

describe("parseCssFont", () => {
  it("extracts size and family stack from a CSS font shorthand", () => {
    expect(
      parseCssFont("bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif"),
    ).toEqual({
      size: 12,
      families: ["FrutigerNeueW02-Regular", "Frutiger", "sans-serif"],
    });
  });
});

describe("makeGetImage", () => {
  it("returns a URL string for icon-image URLs not in the icon set", () => {
    const getImage = makeGetImage([]);
    const url = "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png";
    // first arg (layer) is unused by the callback
    expect(getImage({} as never, url)).toBe(url);
    expect(getImage({} as never, "not-a-url")).toBeUndefined();
  });
});

// The doc's reference example: ch.bafu.hydroweb-messstationen_grundwassertemperatur
// (icon type + label + resolution bands). Verifies the fixes the GEOIN doc surfaced.
const GRUNDWASSERTEMPERATUR = {
  type: "unique",
  property: "quant-class",
  values: [
    {
      geomType: "point",
      value: 0,
      minResolution: 100,
      vectorOptions: {
        type: "icon",
        src: "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png",
      },
    },
    {
      geomType: "point",
      value: 0,
      maxResolution: 100,
      vectorOptions: {
        type: "icon",
        src: "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata16.png",
        label: {
          template: "${name}",
          text: {
            textAlign: "center",
            textBaseline: "middle",
            font: "bold 12px FrutigerNeueW02-Regular,Frutiger,sans-serif",
            scale: 1,
            offsetY: -28,
            padding: [2, 2, 2, 2],
            stroke: { color: "rgba(14,80,114,0.9)", width: 3 },
            backgroundFill: { color: "rgba(14,80,114,0.9)" },
            fill: { color: "white" },
          },
        },
      },
    },
  ],
} as unknown as GeoAdminGeoJSONStyleDefinition;

describe("geoadminToMapLibreStyle - icon + label + resolution (doc reference)", () => {
  // res 100 -> zoom 14, matching the doc's expected conversion.
  const resolutionToZoom = (res: number) => (res === 100 ? 14 : 0);
  const { style, icons } = geoadminToMapLibreStyle(
    GRUNDWASSERTEMPERATUR,
    "src",
    { resolutionToZoom },
  );

  it("emits two symbol layers, no generated shape icons", () => {
    expect(style.layers).toHaveLength(2);
    expect(style.layers.every((l) => l.type === "symbol")).toBe(true);
    expect(icons).toHaveLength(0);
  });

  it("uses the icon src URL as icon-image and maps resolution to zoom", () => {
    const small = style.layers[0]!;
    expect(small.layout!["icon-image"]).toBe(
      "https://data.geo.admin.ch/ch.meteoschweiz/images/nodata14.png",
    );
    expect(small.filter).toEqual([
      "==",
      ["to-string", ["get", "quant-class"]],
      "0",
    ]);
    // minResolution 100 -> maxzoom 14
    expect(small.maxzoom).toBe(14);
    expect(small.minzoom).toBeUndefined();
  });

  it("converts the label faithfully (font stack, px->em offset, halo)", () => {
    const large = style.layers[1]!;
    expect(large.minzoom).toBe(14); // maxResolution 100 -> minzoom
    expect(large.layout!["text-field"]).toEqual(["get", "name"]);
    expect(large.layout!["text-font"]).toEqual([
      "FrutigerNeueW02-Regular",
      "Frutiger",
      "sans-serif",
    ]);
    expect(large.layout!["text-size"]).toBe(12);
    expect(large.layout!["text-anchor"]).toBe("center");
    // -28px / 12px ≈ -2.33em (the doc rounds to -2.3)
    expect((large.layout!["text-offset"] as number[])[1]).toBeCloseTo(
      -28 / 12,
      5,
    );
    expect(large.paint!["text-color"]).toBe("white");
    expect(large.paint!["text-halo-color"]).toBe("rgba(14,80,114,0.9)");
    expect(large.paint!["text-halo-width"]).toBe(3);
  });
});
