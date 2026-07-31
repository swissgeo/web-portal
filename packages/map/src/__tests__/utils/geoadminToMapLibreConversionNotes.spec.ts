import { describe, it, expect } from "vitest";

import type { GeoAdminGeoJSONStyleDefinition } from "@/utils/geojson";

import { geoadminToMapLibreConversionNotes } from "@/utils/geoadminToMapLibreStyle";

describe("geoadminToMapLibreConversionNotes - top-level selection model", () => {
  it("notes the single-type model", () => {
    const def: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "n/a",
      geomType: "polygon",
      vectorOptions: {
        type: "square",
        fill: { color: "#ff0000" },
        stroke: { color: "#000000", width: 1 },
      },
    };
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: expect.stringContaining('type "single"'),
      }),
    );
    expect(notes).toContainEqual(
      expect.objectContaining({ geoadmin: "polygon fill color" }),
    );
    expect(notes).toContainEqual(
      expect.objectContaining({ geoadmin: "polygon stroke" }),
    );
  });

  it("notes the unique-type model with the property and value count", () => {
    const def = {
      type: "unique",
      property: "cls",
      values: [
        {
          geomType: "line",
          value: 0,
          vectorOptions: { stroke: { color: "#000", width: 1 } },
        },
      ],
    } as unknown as GeoAdminGeoJSONStyleDefinition;
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: 'type "unique" on property "cls" — 1 discrete value(s)',
      }),
    );
    expect(notes).toContainEqual(
      expect.objectContaining({ geoadmin: "line geometry stroke" }),
    );
  });

  it("notes the range-type model with the property and band count", () => {
    const def = {
      type: "range",
      property: "value",
      ranges: [
        {
          geomType: "polygon",
          range: [0, 10],
          vectorOptions: { fill: { color: "#fff" } },
        },
      ],
    } as unknown as GeoAdminGeoJSONStyleDefinition;
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: 'type "range" on property "value" — 1 numeric band(s)',
      }),
    );
  });
});

describe("geoadminToMapLibreConversionNotes - point shapes", () => {
  it("notes a circle point", () => {
    const def: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "n/a",
      geomType: "point",
      vectorOptions: {
        type: "circle",
        radius: 4,
        fill: { color: "#000" },
        stroke: { color: "#fff", width: 1 },
      },
    };
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: 'point "circle" (radius/fill/stroke)',
      }),
    );
  });

  it("notes an icon point", () => {
    const def: GeoAdminGeoJSONStyleDefinition = {
      type: "single",
      property: "n/a",
      geomType: "point",
      vectorOptions: { type: "icon", src: "https://example.com/a.png" },
    };
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: 'point "icon" (external src image)',
      }),
    );
  });

  it("notes a generated shape icon", () => {
    const def = {
      type: "single",
      property: "n/a",
      geomType: "point",
      vectorOptions: {
        type: "triangle",
        fill: { color: "#000" },
        stroke: { color: "#fff", width: 1 },
      },
    } as unknown as GeoAdminGeoJSONStyleDefinition;
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({ geoadmin: 'point "triangle" shape' }),
    );
  });
});

describe("geoadminToMapLibreConversionNotes - labels", () => {
  const def = {
    type: "single",
    property: "n/a",
    geomType: "point",
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#000" },
      label: {
        template: "${name}",
        text: {
          font: "bold 12px Arial",
          textBaseline: "middle",
          textAlign: "center",
          offsetY: -10,
          fill: { color: "white" },
          stroke: { color: "#000", width: 1 },
        },
      },
    },
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const notes = geoadminToMapLibreConversionNotes(def);

  it.each([
    "label template",
    "label CSS font shorthand",
    "label textBaseline/textAlign",
    "label pixel offset",
    "label fill color",
    "label stroke",
  ])("notes %s", (geoadminText) => {
    expect(notes).toContainEqual(
      expect.objectContaining({ geoadmin: geoadminText }),
    );
  });
});

describe("geoadminToMapLibreConversionNotes - rotation", () => {
  it("notes a static rotation", () => {
    const def = {
      type: "single",
      property: "n/a",
      geomType: "point",
      vectorOptions: {
        type: "triangle",
        rotation: 1,
        fill: { color: "#000" },
        stroke: { color: "#fff", width: 1 },
      },
    } as unknown as GeoAdminGeoJSONStyleDefinition;
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({ geoadmin: "static rotation (radians)" }),
    );
  });

  it("notes a data-driven rotation naming the source property", () => {
    const def = {
      type: "single",
      property: "n/a",
      geomType: "point",
      rotation: "bearing",
      vectorOptions: { type: "icon", src: "https://example.com/a.png" },
    } as unknown as GeoAdminGeoJSONStyleDefinition;
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: 'data-driven rotation from property "bearing"',
      }),
    );
  });
});

describe("geoadminToMapLibreConversionNotes - resolution bands", () => {
  const def: GeoAdminGeoJSONStyleDefinition = {
    type: "single",
    property: "n/a",
    geomType: "point",
    minResolution: 10,
    maxResolution: 100,
    vectorOptions: {
      type: "circle",
      radius: 4,
      fill: { color: "#000" },
      stroke: { color: "#fff", width: 1 },
    },
  };

  it("notes the band is converted to zoom when resolutionToZoom is supplied", () => {
    const notes = geoadminToMapLibreConversionNotes(def, {
      resolutionToZoom: (res) => res,
    });
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: "minResolution / maxResolution band",
        maplibre: expect.stringContaining("minzoom"),
      }),
    );
  });

  it("notes the band is not converted when resolutionToZoom is omitted", () => {
    const notes = geoadminToMapLibreConversionNotes(def);
    expect(notes).toContainEqual(
      expect.objectContaining({
        geoadmin: "minResolution / maxResolution band",
        maplibre: expect.stringContaining("not converted"),
      }),
    );
  });
});

describe("geoadminToMapLibreConversionNotes - draw order", () => {
  const MULTI = {
    type: "unique",
    property: "cls",
    values: [
      {
        geomType: "point",
        value: 0,
        vectorOptions: { type: "icon", src: "https://example.com/a.png" },
      },
      {
        geomType: "polygon",
        value: 1,
        vectorOptions: { fill: { color: "#fff" } },
      },
    ],
  } as unknown as GeoAdminGeoJSONStyleDefinition;
  const SINGLE_ENTRY = {
    type: "single",
    property: "n/a",
    geomType: "polygon",
    vectorOptions: { fill: { color: "#fff" } },
  } as unknown as GeoAdminGeoJSONStyleDefinition;

  it("mentions point entries staying grouped when points are present", () => {
    const notes = geoadminToMapLibreConversionNotes(MULTI);
    const note = notes.find((n) =>
      n.geoadmin.includes("interleaved per feature"),
    )!;
    expect(note.maplibre).toContain("points are still grouped by entry");
  });

  it("omits the draw-order note for a single-entry style", () => {
    const notes = geoadminToMapLibreConversionNotes(SINGLE_ENTRY);
    expect(
      notes.find((n) => n.geoadmin.includes("interleaved per feature")),
    ).toBeUndefined();
  });
});

describe("geoadminToMapLibreConversionNotes - deduplication", () => {
  it("does not repeat an identical note for repeated unique values", () => {
    const def = {
      type: "unique",
      property: "cls",
      values: [
        {
          geomType: "point",
          value: 0,
          vectorOptions: {
            type: "circle",
            radius: 4,
            fill: { color: "#000" },
            stroke: { color: "#fff", width: 1 },
          },
        },
        {
          geomType: "point",
          value: 1,
          vectorOptions: {
            type: "circle",
            radius: 6,
            fill: { color: "#111" },
            stroke: { color: "#eee", width: 1 },
          },
        },
      ],
    } as unknown as GeoAdminGeoJSONStyleDefinition;
    const notes = geoadminToMapLibreConversionNotes(def);
    const circleNotes = notes.filter(
      (n) => n.geoadmin === 'point "circle" (radius/fill/stroke)',
    );
    expect(circleNotes).toHaveLength(1);
  });
});
