import type { Geometry } from "ol/geom";

import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { DESCRIPTION_KEY, TITLE_KEY } from "@/utils/drawingMetadata";
import { initializeMetadataProperties } from "@/utils/drawingMetadata";
import {
  ICON_ANCHOR_KEY,
  ICON_SIZE_KEY,
  ICON_URL_KEY,
  initializeStyleProperties,
  mapKmlStylesToFeatureProperties,
  SHOW_DESCRIPTION_KEY,
  SHOW_ICON_KEY,
  SHOW_TITLE_KEY,
  TEXT_COLOR_KEY,
  TEXT_HALO_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE_KEY,
} from "@/utils/drawingStyleCommon";

type GeoAdminStyleOptions = {
  iconScale?: number;
  textScale?: number;
};

function makePointFeature(
  properties: Record<string, unknown> = {},
): Feature<Geometry> {
  const feature = new Feature<Geometry>(new Point([0, 0]));
  initializeMetadataProperties(feature);
  initializeStyleProperties(feature);
  feature.setProperties(properties);
  return feature;
}

function makeGeoAdminStyle({
  iconScale = 0.75,
  textScale = 1.5,
}: GeoAdminStyleOptions = {}) {
  return new Style({
    image: new Icon({
      anchor: [8, 36],
      anchorXUnits: "pixels",
      anchorYUnits: "pixels",
      scale: iconScale,
      size: [32, 40],
      src: "https://geo.admin.test/marker.png",
    }),
    text: new Text({
      fill: new Fill({ color: [17, 34, 51, 0.8] }),
      scale: textScale,
      stroke: new Stroke({ color: [238, 221, 204, 1], width: 3 }),
      text: "Geo Admin title",
    }),
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("Geo Admin point style matching", () => {
  it("maps marker metadata, icon, anchor, text colors, and visibility", () => {
    const feature = makePointFeature({
      description: "Imported description",
      name: "Imported title",
      showDescriptionOnMap: "true",
      textOffset: "1,-1",
      type: "marker",
    });
    feature.setStyle(makeGeoAdminStyle());

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(TITLE_KEY)).toBe("Imported title");
    expect(feature.get(DESCRIPTION_KEY)).toBe("Imported description");
    expect(feature.get(ICON_URL_KEY)).toBe("https://geo.admin.test/marker.png");
    expect(feature.get(ICON_ANCHOR_KEY)).toEqual([0.25, 0.9]);
    expect(feature.get(ICON_SIZE_KEY)).toBe("medium");
    expect(feature.get(TEXT_PLACEMENT_KEY)).toBe("north-east");
    expect(feature.get(TEXT_COLOR_KEY)).toBe("#112233");
    expect(feature.get(TEXT_HALO_COLOR_KEY)).toBe("#eeddcc");
    expect(feature.get(TEXT_SIZE_KEY)).toBe("medium");
    expect(feature.get(SHOW_ICON_KEY)).toBe(true);
    expect(feature.get(SHOW_TITLE_KEY)).toBe(true);
    expect(feature.get(SHOW_DESCRIPTION_KEY)).toBe(true);
    expect(feature.getStyle()).toBeUndefined();
  });

  it.each([
    [0.5, "small"],
    [0.659, "small"],
    [0.66, "medium"],
    [0.874, "medium"],
    [0.875, "large"],
    [1.124, "large"],
    [1.125, "xlarge"],
    [1.25, "xlarge"],
  ] as const)("maps icon scale %s to %s", (scale, expectedSize) => {
    const feature = makePointFeature({ type: "marker" });
    feature.setStyle(makeGeoAdminStyle({ iconScale: scale }));

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(ICON_SIZE_KEY)).toBe(expectedSize);
  });

  it.each([
    [0.8, "small"],
    [1.149, "small"],
    [1.15, "medium"],
    [1.749, "medium"],
    [1.75, "large"],
    [2.249, "large"],
    [2.25, "xlarge"],
    [2.5, "xlarge"],
  ] as const)("maps text scale %s to %s", (scale, expectedSize) => {
    const feature = makePointFeature({ type: "marker" });
    feature.setStyle(makeGeoAdminStyle({ textScale: scale }));

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(TEXT_SIZE_KEY)).toBe(expectedSize);
  });

  it.each([
    ["0,0", "center"],
    ["0,-1", "north"],
    ["0,1", "south"],
    ["-1,0", "west"],
    ["1,0", "east"],
    ["-1,-1", "north-west"],
    ["1,-1", "north-east"],
    ["-1,1", "south-west"],
    ["1,1", "south-east"],
    ["", "center"],
    ["invalid", "center"],
    ["x,y", "center"],
  ] as const)("maps text offset %s to %s", (offset, expectedPlacement) => {
    const feature = makePointFeature({ textOffset: offset, type: "marker" });
    feature.setStyle(makeGeoAdminStyle());

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(TEXT_PLACEMENT_KEY)).toBe(expectedPlacement);
  });

  it("maps annotations to visible text without an icon", () => {
    const feature = makePointFeature({
      name: "Annotation",
      type: "annotation",
    });
    feature.setStyle(makeGeoAdminStyle());

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(SHOW_ICON_KEY)).toBe(false);
    expect(feature.get(SHOW_TITLE_KEY)).toBe(true);
    expect(feature.get(SHOW_DESCRIPTION_KEY)).toBe(false);
  });

  it.each([
    ["true", true],
    ["false", false],
    [true, false],
    [undefined, false],
  ])(
    "maps marker description visibility from %s",
    (showDescriptionOnMap, expected) => {
      const feature = makePointFeature({
        showDescriptionOnMap,
        type: "marker",
      });
      feature.setStyle(makeGeoAdminStyle());

      initializeMetadataProperties(feature);
      mapKmlStylesToFeatureProperties(feature);

      expect(feature.get(SHOW_DESCRIPTION_KEY)).toBe(expected);
    },
  );

  it("resolves a KML style function returning a style array", () => {
    const feature = makePointFeature({ type: "marker" });
    const style = makeGeoAdminStyle();
    feature.setStyle(() => [style]);

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(ICON_URL_KEY)).toBe("https://geo.admin.test/marker.png");
    expect(feature.getStyle()).toBeUndefined();
  });

  it("preserves initialized text colors when imported colors are CSS strings", () => {
    const feature = makePointFeature({ type: "marker" });
    feature.setStyle(
      new Style({
        text: new Text({
          fill: new Fill({ color: "red" }),
          scale: 1.5,
          stroke: new Stroke({ color: "white" }),
          text: "Title",
        }),
      }),
    );

    initializeMetadataProperties(feature);
    mapKmlStylesToFeatureProperties(feature);

    expect(feature.get(TEXT_COLOR_KEY)).toBe("#000000");
    expect(feature.get(TEXT_HALO_COLOR_KEY)).toBe("#FFFFFF");
  });
});
