import type { Geometry } from "ol/geom";

import { strFromU8, unzipSync } from "fflate";
import Feature from "ol/Feature";
import { Circle, LineString, Point, Polygon } from "ol/geom";
import { Fill, Icon, Style, Text } from "ol/style";
import { registerDocument } from "ol/xml";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { DESCRIPTION_KEY, TITLE_KEY } from "@/utils/drawingMetadata";
import {
  SHOW_DESCRIPTION_KEY,
  SHOW_ICON_KEY,
  SHOW_TITLE_KEY,
  TEXT_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE_KEY,
} from "@/utils/drawingStyleCommon";
import {
  cloneToSerializationCompatibleFeatures,
  convertCircleToLineString,
  convertCircleToMultiLineString,
  convertCircleToPolygon,
  convertLineStringToMultiLineString,
  convertPolygonToLineString,
  convertPolygonToMultiLineString,
  exportFormatToMimeType,
  olFeatureToGeoJSON,
  olFeatureToGPX,
  olFeatureToKML,
  olFeatureToKMZ,
} from "@/utils/exportUtils";

beforeAll(() => {
  // happy-dom does not implement CDATA sections, which OpenLayers uses for
  // multiline XML text. A text node is equivalent for these test values.
  const xmlDocument = document.implementation.createDocument("", "", null);
  Object.defineProperty(xmlDocument, "createCDATASection", {
    value: xmlDocument.createTextNode.bind(xmlDocument),
  });
  registerDocument(xmlDocument);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeFeature(
  geometry?: Geometry,
  properties: Record<string, unknown> = {},
) {
  const feature = new Feature<Geometry>(geometry);
  feature.setProperties(properties);
  return feature;
}

function getGeometry<T extends Geometry>(feature: Feature<T>): T {
  const geometry = feature.getGeometry();
  if (!geometry) {
    throw new Error("Expected feature to have a geometry");
  }
  return geometry;
}

function makePolygon() {
  return new Polygon([
    [
      [0, 0],
      [4, 0],
      [4, 3],
      [0, 0],
    ],
  ]);
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function getElementText(parent: ParentNode, tagName: string): string | null {
  return parent.querySelector(tagName)?.textContent ?? null;
}

function getExtendedDataValue(doc: Document, name: string): string | null {
  return (
    Array.from(doc.querySelectorAll("Data"))
      .find((element) => element.getAttribute("name") === name)
      ?.querySelector("value")?.textContent ?? null
  );
}

describe("export format metadata", () => {
  it("maps supported drawing export formats to their MIME types", () => {
    expect(exportFormatToMimeType).toEqual({
      geojson: "application/geo+json",
      "gpx-track": "application/gpx+xml",
      "gpx-route": "application/gpx+xml",
      kml: "application/vnd.google-earth.kml+xml",
      kmz: "application/vnd.google-earth.kmz",
    });
  });
});

describe("OpenLayers feature serializers", () => {
  it("serializes map-coordinate point features to WGS84 GeoJSON", () => {
    const feature = makeFeature(new Point([2600000, 1200000]), {
      name: "Survey point",
    });

    const geoJson = JSON.parse(olFeatureToGeoJSON(feature));

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features).toHaveLength(1);
    expect(geoJson.features[0].geometry.type).toBe("Point");
    expect(geoJson.features[0].geometry.coordinates[0]).toBeCloseTo(7.4386, 3);
    expect(geoJson.features[0].geometry.coordinates[1]).toBeCloseTo(46.951, 3);
    expect(geoJson.features[0].properties.name).toBe("Survey point");
  });

  it("converts circles to polygon and center-point features for GeoJSON", () => {
    const feature = makeFeature(new Circle([2600000, 1200000], 100), {
      name: "Inspection radius",
    });

    const geoJson = JSON.parse(olFeatureToGeoJSON(feature));

    expect(geoJson.features).toHaveLength(2);
    expect(
      geoJson.features.map(
        (entry: { geometry: { type: string } }) => entry.geometry.type,
      ),
    ).toEqual(["Polygon", "Point"]);
    expect(
      geoJson.features.map(
        (entry: { properties: { name: string } }) => entry.properties.name,
      ),
    ).toEqual(["Inspection radius", "Inspection radius"]);
  });

  it("serializes GPX tracks and routes with the matching GPX element type", () => {
    const feature = makeFeature(
      new LineString([
        [2600000, 1200000],
        [2600010, 1200010],
      ]),
    );

    expect(olFeatureToGPX(feature, "track")).toContain("<trk>");
    expect(olFeatureToGPX(feature, "route")).toContain("<rte>");
  });

  it("serializes KML and wraps KMZ output in a doc.kml archive", async () => {
    const feature = makeFeature(new Point([2600000, 1200000]), {
      name: "KML point",
    });
    const kml = olFeatureToKML(feature);
    const kmz = await olFeatureToKMZ(feature);
    const kmzEntries = unzipSync(new Uint8Array(kmz));

    expect(kml).toContain("<kml");
    expect(kml).toContain("<Placemark>");
    expect(Object.keys(kmzEntries)).toEqual(["doc.kml"]);
    expect(strFromU8(kmzEntries["doc.kml"])).toContain("<kml");
  });

  it("embeds unique point icons in KMZ and uses archive-relative hrefs", async () => {
    const iconBytes = new Uint8Array([137, 80, 78, 71]);
    const iconUrl = "https://icons.test/default/star/1x/46/165/3.png";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(iconBytes.buffer),
      headers: new Headers({ "content-type": "image/png" }),
      ok: true,
      status: 200,
      statusText: "OK",
    } as unknown as Response);
    const features = [
      makeFeature(new Point([2600000, 1200000])),
      makeFeature(new Point([2600010, 1200010])),
    ];
    for (const feature of features) {
      feature.setStyle(
        new Style({
          image: new Icon({
            anchor: [8, 24],
            anchorXUnits: "pixels",
            anchorYUnits: "pixels",
            scale: 0.75,
            size: [32, 32],
            src: iconUrl,
          }),
        }),
      );
    }

    const kmzEntries = unzipSync(
      new Uint8Array(await olFeatureToKMZ(features)),
    );
    const kml = strFromU8(kmzEntries["doc.kml"]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(iconUrl);
    expect(Object.keys(kmzEntries)).toEqual(["doc.kml", "files/icon-1.png"]);
    expect(kmzEntries["files/icon-1.png"]).toEqual(iconBytes);
    expect(kml).toContain("<href>files/icon-1.png</href>");
    expect(kml).not.toContain(iconUrl);

    const doc = parseXml(kml);
    const iconStyles = doc.querySelectorAll("IconStyle");
    expect(iconStyles).toHaveLength(2);
    expect(getElementText(iconStyles[0]!, "scale")).toBe("0.75");
    expect(iconStyles[0]!.querySelector("hotSpot")?.getAttribute("x")).toBe(
      "8",
    );
    expect(iconStyles[0]!.querySelector("hotSpot")?.getAttribute("y")).toBe(
      "8",
    );
  });

  it("rejects KMZ creation when a required point icon cannot be fetched", async () => {
    const iconUrl = "https://icons.test/unavailable.png";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      headers: new Headers(),
      ok: false,
      status: 503,
      statusText: "Unavailable",
    } as unknown as Response);
    const feature = makeFeature(new Point([2600000, 1200000]));
    feature.setStyle(
      new Style({
        image: new Icon({ src: iconUrl }),
      }),
    );

    await expect(olFeatureToKMZ(feature)).rejects.toThrow(
      `Failed to fetch KMZ icon ${iconUrl}: 503 Unavailable`,
    );
  });

  it("adapts multiline point labels and their OpenLayers style to KML", () => {
    const feature = makeFeature(new Point([2600000, 1200000]), {
      [TITLE_KEY]: "First line\nSecond line",
      [DESCRIPTION_KEY]: "Description line one\nDescription line two",
      [SHOW_TITLE_KEY]: true,
      [SHOW_DESCRIPTION_KEY]: true,
      [SHOW_ICON_KEY]: false,
      [TEXT_SIZE_KEY]: "medium",
      [TEXT_COLOR_KEY]: "#123456",
      [TEXT_PLACEMENT_KEY]: "north-east",
    });
    feature.setStyle([
      new Style({
        text: new Text({
          text: feature.get(TITLE_KEY),
          font: "bold 22px Helvetica",
          fill: new Fill({ color: "#123456" }),
          offsetX: 28,
          offsetY: -42,
        }),
      }),
      new Style({
        text: new Text({
          text: feature.get(DESCRIPTION_KEY),
          font: "16.5px Helvetica",
          fill: new Fill({ color: "#123456" }),
          offsetX: 28,
          offsetY: -40,
        }),
      }),
    ]);

    const kml = olFeatureToKML(feature);
    const doc = parseXml(kml);
    const placemark = doc.querySelector("Placemark");

    expect(placemark).not.toBeNull();
    expect(getElementText(placemark!, "name")).toBe(
      "First line\nSecond line\nDescription line one\nDescription line two",
    );
    expect(getElementText(placemark!, "description")).toBe(
      "Description line one\nDescription line two",
    );
    expect(getElementText(placemark!, "LabelStyle > color")).toBe("ff563412");
    expect(getElementText(placemark!, "LabelStyle > scale")).toBe("1.375");
    expect(getElementText(placemark!, "IconStyle > scale")).toBe("0");
    expect(placemark!.querySelector("IconStyle > Icon")?.children).toHaveLength(
      0,
    );
    expect(getExtendedDataValue(doc, "textOffset")).toBe("1,-1");
    expect(getExtendedDataValue(doc, "showDescriptionOnMap")).toBe("true");
    expect(getExtendedDataValue(doc, "type")).toBe("annotation");
  });

  it("exports rich OpenLayers point text without point metadata", () => {
    const feature = makeFeature(new Point([2600000, 1200000]));
    feature.setStyle(
      new Style({
        text: new Text({
          text: ["Rich ", "bold 20px serif", "label", ""],
          font: "20px serif",
          fill: new Fill({ color: "rgba(10, 20, 30, 0.5)" }),
          offsetX: -12,
          offsetY: 8,
          scale: 1.2,
        }),
      }),
    );

    const doc = parseXml(olFeatureToKML(feature));
    const placemark = doc.querySelector("Placemark");

    expect(getElementText(placemark!, "name")).toBe("Rich label");
    expect(getElementText(placemark!, "LabelStyle > color")).toBe("7f1e140a");
    expect(getElementText(placemark!, "LabelStyle > scale")).toBe("1.5");
    expect(getExtendedDataValue(doc, "textOffset")).toBe("-12,8");
    expect(placemark!.querySelector("IconStyle")).toBeNull();
  });

  it("uses point properties when no OpenLayers style is attached", () => {
    const feature = makeFeature(new Point([2600000, 1200000]), {
      [TITLE_KEY]: "Property-driven label",
      [SHOW_TITLE_KEY]: true,
      [SHOW_DESCRIPTION_KEY]: false,
      [SHOW_ICON_KEY]: true,
      [TEXT_SIZE_KEY]: "large",
      [TEXT_COLOR_KEY]: "#abcdef",
      [TEXT_PLACEMENT_KEY]: "south-west",
    });

    const doc = parseXml(olFeatureToKML(feature));
    const placemark = doc.querySelector("Placemark");

    expect(getElementText(placemark!, "name")).toBe("Property-driven label");
    expect(getElementText(placemark!, "LabelStyle > color")).toBe("ffefcdab");
    expect(getElementText(placemark!, "LabelStyle > scale")).toBe("1.875");
    expect(getExtendedDataValue(doc, "textOffset")).toBe("-1,1");
    expect(getExtendedDataValue(doc, "type")).toBe("marker");
    expect(placemark!.querySelector("IconStyle")).toBeNull();

    expect(feature.get("name")).toBeUndefined();
    expect(feature.get("textOffset")).toBeUndefined();
    expect(feature.get("type")).toBeUndefined();
    expect(feature.getStyle()).toBeNull();
  });
});

describe("geometry conversion helpers", () => {
  it("converts circles to polygon and center-point features", () => {
    const [polygonFeature, centerFeature] = convertCircleToPolygon(
      makeFeature(new Circle([10, 20], 5), { name: "Circle" }),
      8,
    );

    expect(getGeometry(polygonFeature).getType()).toBe("Polygon");
    expect(
      getGeometry(polygonFeature).getLinearRing(0).getCoordinates(),
    ).toHaveLength(9);
    expect(getGeometry(centerFeature).getCoordinates()).toEqual([10, 20]);
    expect(polygonFeature.get("name")).toBe("Circle");
    expect(centerFeature.get("name")).toBe("Circle");
  });

  it("converts circles to line-string and center-point features", () => {
    const [lineStringFeature, centerFeature] = convertCircleToLineString(
      makeFeature(new Circle([10, 20], 5), { name: "Circle" }),
      8,
    );

    expect(getGeometry(lineStringFeature).getType()).toBe("LineString");
    expect(getGeometry(lineStringFeature).getCoordinates()).toHaveLength(9);
    expect(getGeometry(centerFeature).getCoordinates()).toEqual([10, 20]);
  });

  it("converts circles to multi-line-string and center-point features", () => {
    const [multiLineStringFeature, centerFeature] =
      convertCircleToMultiLineString(
        makeFeature(new Circle([10, 20], 5), { name: "Circle" }),
        8,
      );

    expect(getGeometry(multiLineStringFeature).getType()).toBe(
      "MultiLineString",
    );
    expect(
      getGeometry(multiLineStringFeature).getCoordinates()[0],
    ).toHaveLength(9);
    expect(getGeometry(centerFeature).getCoordinates()).toEqual([10, 20]);
  });

  it("converts polygons to line strings from their outer ring", () => {
    const lineStringFeature = convertPolygonToLineString(
      makeFeature(makePolygon(), { name: "Polygon" }),
    );

    expect(getGeometry(lineStringFeature).getCoordinates()).toEqual(
      makePolygon().getLinearRing(0).getCoordinates(),
    );
    expect(lineStringFeature.get("name")).toBe("Polygon");
  });

  it("converts polygons to multi-line strings from their outer ring", () => {
    const multiLineStringFeature = convertPolygonToMultiLineString(
      makeFeature(makePolygon(), { name: "Polygon" }),
    );

    expect(getGeometry(multiLineStringFeature).getCoordinates()).toEqual([
      makePolygon().getLinearRing(0).getCoordinates(),
    ]);
    expect(multiLineStringFeature.get("name")).toBe("Polygon");
  });

  it("converts line strings to single-part multi-line strings", () => {
    const coordinates = [
      [0, 0],
      [3, 4],
    ];

    const multiLineStringFeature = convertLineStringToMultiLineString(
      makeFeature(new LineString(coordinates), { name: "Line" }),
    );

    expect(getGeometry(multiLineStringFeature).getCoordinates()).toEqual([
      coordinates,
    ]);
    expect(multiLineStringFeature.get("name")).toBe("Line");
  });

  it("throws when conversion helpers receive the wrong geometry type", () => {
    const pointFeature = makeFeature(new Point([0, 0]));

    expect(() => convertCircleToPolygon(pointFeature)).toThrow(
      "The provided feature is not a circle.",
    );
    expect(() => convertCircleToLineString(pointFeature)).toThrow(
      "The provided feature is not a circle.",
    );
    expect(() => convertCircleToMultiLineString(pointFeature)).toThrow(
      "The provided feature is not a circle.",
    );
    expect(() => convertPolygonToLineString(pointFeature)).toThrow(
      "The provided feature is not a polygon.",
    );
    expect(() => convertPolygonToMultiLineString(pointFeature)).toThrow(
      "The provided feature is not a polygon.",
    );
    expect(() => convertLineStringToMultiLineString(pointFeature)).toThrow(
      "The provided feature is not a line string.",
    );
  });
});

describe("cloneToSerializationCompatibleFeatures", () => {
  it.each(["Polygon", "LineString", "MultiLineString"] as const)(
    "converts circles to %s-compatible geometries and center points",
    (circlesTo) => {
      const [convertedFeature, centerFeature] =
        cloneToSerializationCompatibleFeatures(
          [makeFeature(new Circle([10, 20], 5), { name: "Circle" })],
          { circlesTo },
        );

      expect(getGeometry(convertedFeature).getType()).toBe(circlesTo);
      expect(getGeometry(centerFeature).getType()).toBe("Point");
      expect(convertedFeature.get("name")).toBe("Circle");
      expect(centerFeature.get("name")).toBe("Circle");
    },
  );

  it.each(["LineString", "MultiLineString"] as const)(
    "converts polygons to %s-compatible geometries",
    (polygonsTo) => {
      const [convertedFeature] = cloneToSerializationCompatibleFeatures(
        [makeFeature(makePolygon(), { name: "Polygon" })],
        { polygonsTo },
      );

      expect(getGeometry(convertedFeature).getType()).toBe(polygonsTo);
      expect(convertedFeature.get("name")).toBe("Polygon");
    },
  );

  it("converts line strings to multi-line strings when requested", () => {
    const [convertedFeature] = cloneToSerializationCompatibleFeatures(
      [
        makeFeature(
          new LineString([
            [0, 0],
            [3, 4],
          ]),
          { name: "Line" },
        ),
      ],
      { lineStringsTo: "MultiLineString" },
    );

    expect(getGeometry(convertedFeature).getType()).toBe("MultiLineString");
    expect(convertedFeature.get("name")).toBe("Line");
  });

  it("skips features without geometry", () => {
    const pointFeature = makeFeature(new Point([1, 2]));

    const clonedFeatures = cloneToSerializationCompatibleFeatures([
      makeFeature(),
      pointFeature,
    ]);

    expect(clonedFeatures).toHaveLength(1);
    expect(getGeometry(clonedFeatures[0]).getType()).toBe("Point");
  });

  it("clones supported features without sharing the original geometry", () => {
    const originalGeometry = new Point([1, 2]);
    const [clonedFeature] = cloneToSerializationCompatibleFeatures([
      makeFeature(originalGeometry, { name: "Original" }),
    ]);

    expect(clonedFeature.get("name")).toBe("Original");
    expect(getGeometry(clonedFeature)).not.toBe(originalGeometry);

    (getGeometry(clonedFeature) as Point).translate(10, 10);

    expect(originalGeometry.getCoordinates()).toEqual([1, 2]);
  });
});
