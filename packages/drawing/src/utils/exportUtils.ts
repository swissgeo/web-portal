import type { Geometry, Circle, Polygon } from "ol/geom";

import { registerProj4 } from "@swissgeo/coordinates";
import { EPSG_4326_WGS84, EPSG_2056_CH1903 } from "@swissgeo/shared";
import { strToU8, zipSync } from "fflate";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import GPX from "ol/format/GPX";
import KML from "ol/format/KML";
import { LineString, MultiLineString, Point } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { register } from "ol/proj/proj4";
import { Fill, Icon, Style, Text } from "ol/style";
import proj4 from "proj4";

import type { TextSize } from "./drawingStyleCommon";

import { DESCRIPTION_KEY, TITLE_KEY } from "./drawingMetadata";
import {
  SHOW_DESCRIPTION_KEY,
  SHOW_ICON_KEY,
  SHOW_TITLE_KEY,
  TEXT_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE,
  TEXT_SIZE_KEY,
} from "./drawingStyleCommon";

registerProj4(proj4);
register(proj4);

export const exportFormatToMimeType: Record<string, string> = {
  geojson: "application/geo+json",
  "gpx-track": "application/gpx+xml",
  "gpx-route": "application/gpx+xml",
  kml: "application/vnd.google-earth.kml+xml",
  kmz: "application/vnd.google-earth.kmz",
};

// OpenLayers renders KML labels with a 16 px default font. KML only supports a
// relative label scale, so use that default to preserve the effective OL size.
const KML_DEFAULT_LABEL_FONT_SIZE = 16;
const KML_NO_ICON_PLACEHOLDER = "swissgeo-kml-no-icon";

const TEXT_PLACEMENT_OFFSET = {
  north: [0, -1],
  center: [0, 0],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
  "north-east": [1, -1],
  "north-west": [-1, -1],
  "south-east": [1, 1],
  "south-west": [-1, 1],
} as const;

function isEnabled(value: unknown): boolean {
  return value === true || value === "true";
}

function textContentToString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    // Rich OL text is an array of text/font pairs. KML cannot retain the
    // different fonts, but it can retain their complete textual content.
    return value.filter((_, index) => index % 2 === 0).join("");
  }
  return value ?? "";
}

function resolvePointTextStyles(feature: Feature<Geometry>): Text[] {
  const styleFunction = feature.getStyleFunction();
  if (!styleFunction) {
    return [];
  }

  const resolvedStyle = styleFunction(feature, 0);
  const styles = Array.isArray(resolvedStyle)
    ? resolvedStyle
    : resolvedStyle
      ? [resolvedStyle]
      : [];

  return styles
    .map((style) => style.getText())
    .filter((text): text is Text => Boolean(text));
}

function resolvePointIconStyle(feature: Feature<Geometry>): Icon | undefined {
  const styleFunction = feature.getStyleFunction();
  if (!styleFunction) {
    return undefined;
  }

  const resolvedStyle = styleFunction(feature, 0);
  const styles = Array.isArray(resolvedStyle)
    ? resolvedStyle
    : resolvedStyle
      ? [resolvedStyle]
      : [];

  return styles
    .map((style) => style.getImage())
    .find((image): image is Icon => "getSrc" in image);
}

function getFontSize(font: string | undefined): number | undefined {
  const match = font?.match(/(?:^|\s)(\d+(?:\.\d+)?)px(?:\s|\/|$)/);
  if (!match) {
    return undefined;
  }

  const fontSize = Number(match[1]);
  return Number.isFinite(fontSize) ? fontSize : undefined;
}

function getKmlLabelScale(
  textStyle: Text | undefined,
  fallbackFontSize: number,
): number {
  const fontSize = getFontSize(textStyle?.getFont()) ?? fallbackFontSize;
  const olScale = textStyle?.getScale();
  const horizontalScale = Array.isArray(olScale)
    ? (olScale[0] ?? 1)
    : (olScale ?? 1);

  return (fontSize * horizontalScale) / KML_DEFAULT_LABEL_FONT_SIZE;
}

function getKmlTextOffset(
  feature: Feature<Geometry>,
  textStyle: Text | undefined,
): [number, number] {
  const existingOffset = feature.get("textOffset");
  if (typeof existingOffset === "string") {
    const parsedOffset = existingOffset.split(",").map(Number);
    if (
      parsedOffset.length === 2 &&
      parsedOffset.every((value) => Number.isFinite(value))
    ) {
      return [parsedOffset[0]!, parsedOffset[1]!];
    }
  }

  const placement = feature.get(TEXT_PLACEMENT_KEY);
  if (typeof placement === "string" && placement in TEXT_PLACEMENT_OFFSET) {
    return [
      ...TEXT_PLACEMENT_OFFSET[placement as keyof typeof TEXT_PLACEMENT_OFFSET],
    ];
  }

  return textStyle ? [textStyle.getOffsetX(), textStyle.getOffsetY()] : [0, 0];
}

/**
 * Adapt a point's OL text styles to the subset supported by KML.
 *
 * A KML Placemark has a single label and LabelStyle, so visible OL text blocks
 * are joined into one multiline label and styled like the first block. The
 * description also remains available through the standard description field.
 * An existing offset, or the configured placement direction, is stored in
 * textOffset because standard KML has no label-placement property.
 */
function applyPointKmlStyle(
  feature: Feature<Geometry>,
  visibleIcon?: Icon,
): void {
  if (feature.getGeometry()?.getType() !== "Point") {
    return;
  }

  const textStyles = resolvePointTextStyles(feature);
  const hasVisibilityProperties =
    feature.get(SHOW_TITLE_KEY) !== undefined ||
    feature.get(SHOW_DESCRIPTION_KEY) !== undefined;
  const title = String(feature.get(TITLE_KEY) ?? "");
  const description = String(feature.get(DESCRIPTION_KEY) ?? "");
  const label = hasVisibilityProperties
    ? [
        isEnabled(feature.get(SHOW_TITLE_KEY)) ? title : "",
        isEnabled(feature.get(SHOW_DESCRIPTION_KEY)) ? description : "",
      ]
        .filter((value) => value.length > 0)
        .join("\n")
    : (textStyles
        .map((textStyle) => textContentToString(textStyle.getText()))
        .find((value) => value.length > 0) ?? "");

  if (feature.get(DESCRIPTION_KEY) !== undefined) {
    feature.set("description", description, true);
  }

  if (hasVisibilityProperties) {
    if (label) {
      feature.set("name", label, true);
    } else {
      feature.unset("name", true);
    }
    feature.set(
      "showDescriptionOnMap",
      isEnabled(feature.get(SHOW_DESCRIPTION_KEY)),
      true,
    );
  } else if (label) {
    feature.set("name", label, true);
  }

  const showIcon = feature.get(SHOW_ICON_KEY);
  if (showIcon !== undefined) {
    feature.set("type", isEnabled(showIcon) ? "marker" : "annotation", true);
  }

  const primaryTextStyle =
    textStyles.find(
      (textStyle) => textContentToString(textStyle.getText()) === label,
    ) ?? textStyles[0];
  const fallbackTextSize =
    TEXT_SIZE[feature.get(TEXT_SIZE_KEY) as TextSize] ??
    KML_DEFAULT_LABEL_FONT_SIZE;
  const fallbackFontSize =
    !isEnabled(feature.get(SHOW_TITLE_KEY)) &&
    isEnabled(feature.get(SHOW_DESCRIPTION_KEY))
      ? fallbackTextSize * 0.75
      : fallbackTextSize;
  const [offsetX, offsetY] = getKmlTextOffset(feature, primaryTextStyle);

  if (label || hasVisibilityProperties) {
    feature.set("textOffset", `${offsetX},${offsetY}`, true);
  }

  const hiddenIcon = showIcon !== undefined && !isEnabled(showIcon);
  if (!label && !hiddenIcon && !visibleIcon) {
    feature.setStyle();
    return;
  }

  const kmlTextStyle = primaryTextStyle
    ? primaryTextStyle.clone()
    : new Text({
        fill: new Fill({ color: feature.get(TEXT_COLOR_KEY) ?? "#333333" }),
      });
  kmlTextStyle.setText(label);
  kmlTextStyle.setScale(
    label ? getKmlLabelScale(primaryTextStyle, fallbackFontSize) : 0,
  );

  feature.setStyle(
    new Style({
      image: hiddenIcon
        ? new Icon({ src: KML_NO_ICON_PLACEHOLDER, scale: 0 })
        : visibleIcon,
      text: label ? kmlTextStyle : undefined,
    }),
  );
}

function writeKmlFeatures(features: Feature<Geometry>[]): string {
  const olKML = new KML();

  return olKML
    .writeFeatures(features, {
      featureProjection: EPSG_2056_CH1903,
      dataProjection: EPSG_4326_WGS84,
    })
    .replace(
      new RegExp(
        `<Icon>\\s*<href>${KML_NO_ICON_PLACEHOLDER}</href>\\s*</Icon>`,
        "g",
      ),
      "<Icon/>",
    );
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceIconHrefs(
  kml: string,
  archiveHrefBySourceHref: Map<string, string>,
): string {
  let result = kml;
  for (const [sourceHref, archiveHref] of archiveHrefBySourceHref) {
    result = result.replaceAll(
      `<href>${escapeXmlText(sourceHref)}</href>`,
      `<href>${escapeXmlText(archiveHref)}</href>`,
    );
  }
  return result;
}

const ICON_FILE_EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

function getIconFileExtension(response: Response, sourceHref: string): string {
  const contentType = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType && ICON_FILE_EXTENSION_BY_CONTENT_TYPE[contentType]) {
    return ICON_FILE_EXTENSION_BY_CONTENT_TYPE[contentType];
  }

  try {
    const extension = new URL(sourceHref).pathname.match(
      /\.([a-zA-Z0-9]{2,5})$/,
    )?.[1];
    if (extension) {
      return extension.toLowerCase();
    }
  } catch {
    // A relative URL can still be fetched and embedded. Use a neutral fallback
    // extension if neither the response nor the URL identifies the image type.
  }

  return "img";
}

type KmzIconAsset = {
  archiveHref: string;
  bytes: Uint8Array;
  sourceHref: string;
};

async function fetchKmzIconAssets(
  sourceHrefs: string[],
): Promise<KmzIconAsset[]> {
  return Promise.all(
    sourceHrefs.map(async (sourceHref, index) => {
      const response = await fetch(sourceHref);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch KMZ icon ${sourceHref}: ${response.status} ${response.statusText}`,
        );
      }

      const extension = getIconFileExtension(response, sourceHref);
      return {
        archiveHref: `files/icon-${index + 1}.${extension}`,
        bytes: new Uint8Array(await response.arrayBuffer()),
        sourceHref,
      };
    }),
  );
}

/**
 * Export one or multiple OpenLayers features to GeoJSON format.
 */
export function olFeatureToGeoJSON(
  feature: Feature<Geometry> | Feature<Geometry>[],
): string {
  const olGeoJSON = new GeoJSON({
    featureProjection: EPSG_2056_CH1903,
    dataProjection: EPSG_4326_WGS84,
  });

  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: "Polygon",
    },
  );
  return olGeoJSON.writeFeatures(features);
}

/**
 * Export one or multiple OpenLayers features to KMZ. Visible point icons are
 * downloaded from their resolved OL Icon styles, deduplicated, and embedded in
 * the archive. The KML document references those local files while retaining
 * the icon scale and anchor serialized by OpenLayers.
 */
export async function olFeatureToKMZ(
  feature: Feature<Geometry> | Feature<Geometry>[],
): Promise<ArrayBuffer> {
  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: "Polygon",
      copyPointStyle: true,
    },
  );
  const iconStyleByFeature = new Map<Feature<Geometry>, Icon>();
  const uniqueSourceHrefs = new Set<string>();

  for (const currentFeature of features) {
    const iconStyle = resolvePointIconStyle(currentFeature);
    const sourceHref = iconStyle?.getSrc();
    if (iconStyle && sourceHref) {
      iconStyleByFeature.set(currentFeature, iconStyle.clone());
      uniqueSourceHrefs.add(sourceHref);
    }
  }

  const iconAssets = await fetchKmzIconAssets([...uniqueSourceHrefs]);
  const archiveHrefBySourceHref = new Map(
    iconAssets.map(({ archiveHref, sourceHref }) => [sourceHref, archiveHref]),
  );

  for (const currentFeature of features) {
    applyPointKmlStyle(currentFeature, iconStyleByFeature.get(currentFeature));
  }

  const kmlString = replaceIconHrefs(
    writeKmlFeatures(features),
    archiveHrefBySourceHref,
  );
  const entries: Record<string, Uint8Array> = {
    "doc.kml": strToU8(kmlString),
  };
  for (const { archiveHref, bytes } of iconAssets) {
    entries[archiveHref] = bytes;
  }

  const zipBuf = zipSync(entries, { level: 6 });

  return zipBuf.buffer;
}

/**
 * Export one or multiple OpenLayers features to GPX format.
 */
export function olFeatureToGPX(
  feature: Feature<Geometry> | Feature<Geometry>[],
  mode: "track" | "route" = "track",
): string {
  const geometryType = mode === "route" ? "LineString" : "MultiLineString";
  const olGPX = new GPX();
  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: geometryType,
      polygonsTo: geometryType,
      lineStringsTo: geometryType,
    },
  );

  return olGPX.writeFeatures(features, {
    featureProjection: EPSG_2056_CH1903,
    dataProjection: EPSG_4326_WGS84,
  });
}

/**
 * Export one or multiple OpenLayers features to KML format. Point label styles
 * are adapted to KML, while custom point icon assets are intentionally omitted.
 */
export function olFeatureToKML(
  feature: Feature<Geometry> | Feature<Geometry>[],
): string {
  const features = cloneToSerializationCompatibleFeatures(
    Array.isArray(feature) ? feature : [feature],
    {
      circlesTo: "Polygon",
      copyPointStyle: true,
    },
  );

  features.forEach((currentFeature) => applyPointKmlStyle(currentFeature));
  return writeKmlFeatures(features);
}

/**
 * Converts OL circle features to polygon features.
 * This is useful for exporting circle features to formats that do not support circles, such as GeoJSON, GPX, or KML.
 * The result is a polygon feature that approximates the circle with a specified number of segments and a point feature representing the center of the circle.
 */
export function convertCircleToPolygon(
  circle: Feature<Geometry>,
  segments: number = 64,
): [Feature<Polygon>, Feature<Point>] {
  const geometry = circle.getGeometry();
  if (!geometry || geometry.getType() !== "Circle") {
    throw new Error("The provided feature is not a circle.");
  }

  const circleGeometry = geometry as Circle;
  const center = circleGeometry.getCenter();
  const centerFeature = new Feature<Point>(new Point(center));
  const polygonGeometry = fromCircle(circleGeometry, segments);
  const polygonFeature = new Feature<Polygon>(polygonGeometry);
  const properties = circle.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original circle feature to the new polygon feature
  polygonFeature.setProperties(properties);
  centerFeature.setProperties(properties);

  return [polygonFeature, centerFeature];
}

/**
 * Convert a Cicle polygon into a LineString feature and a center point feature.
 * This is mainly intended for serialization formats that do no support circles nor polygons, such as GPX
 */
export function convertCircleToLineString(
  circle: Feature<Geometry>,
  segments: number = 64,
): [Feature<LineString>, Feature<Point>] {
  const geometry = circle.getGeometry();
  if (!geometry || geometry.getType() !== "Circle") {
    throw new Error("The provided feature is not a circle.");
  }

  const circleGeometry = geometry as Circle;
  const center = circleGeometry.getCenter();
  const centerFeature = new Feature<Point>(new Point(center));
  const polygonGeometry = fromCircle(circleGeometry, segments);

  const lineStringFeature = new Feature<LineString>(
    new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
  );
  const properties = circle.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original circle feature to the new line string feature
  lineStringFeature.setProperties(properties);
  centerFeature.setProperties(properties);

  return [lineStringFeature, centerFeature];
}

export function convertCircleToMultiLineString(
  circle: Feature<Geometry>,
  segments: number = 64,
): [Feature<MultiLineString>, Feature<Point>] {
  const geometry = circle.getGeometry();
  if (!geometry || geometry.getType() !== "Circle") {
    throw new Error("The provided feature is not a circle.");
  }

  const circleGeometry = geometry as Circle;
  const center = circleGeometry.getCenter();
  const centerFeature = new Feature<Point>(new Point(center));
  const polygonGeometry = fromCircle(circleGeometry, segments);

  const lineStringFeature = new Feature<MultiLineString>(
    new MultiLineString([
      new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
    ]),
  );
  const properties = circle.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original circle feature to the new line string feature
  lineStringFeature.setProperties(properties);
  centerFeature.setProperties(properties);

  return [lineStringFeature, centerFeature];
}

/**
 * Convert a Polygon feature into a LinearRing feature.
 * This is mainly intended for serialization formats that do not support polygons, such as GPX.
 */
export function convertPolygonToLineString(
  polygon: Feature<Geometry>,
): Feature<LineString> {
  const geometry = polygon.getGeometry();
  if (!geometry || geometry.getType() !== "Polygon") {
    throw new Error("The provided feature is not a polygon.");
  }

  const polygonGeometry = geometry as Polygon;
  const lineStringFeature = new Feature<LineString>(
    new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
  );
  const properties = polygon.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original polygon feature to the new line string feature
  lineStringFeature.setProperties(properties);

  return lineStringFeature;
}

export function convertPolygonToMultiLineString(
  polygon: Feature<Geometry>,
): Feature<MultiLineString> {
  const geometry = polygon.getGeometry();
  if (!geometry || geometry.getType() !== "Polygon") {
    throw new Error("The provided feature is not a polygon.");
  }

  const polygonGeometry = geometry as Polygon;
  const lineStringFeature = new Feature<MultiLineString>(
    new MultiLineString([
      new LineString(polygonGeometry.getLinearRing(0).getCoordinates()),
    ]),
  );
  const properties = polygon.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original polygon feature to the new line string feature
  lineStringFeature.setProperties(properties);

  return lineStringFeature;
}

export function convertLineStringToMultiLineString(
  lineString: Feature<Geometry>,
): Feature<MultiLineString> {
  const geometry = lineString.getGeometry();
  if (!geometry || geometry.getType() !== "LineString") {
    throw new Error("The provided feature is not a line string.");
  }

  const lineStringGeometry = geometry as LineString;
  const multiLineStringFeature = new Feature<MultiLineString>(
    new MultiLineString([lineStringGeometry.getCoordinates()]),
  );
  const properties = lineString.getProperties();
  delete properties.geometry; // Remove the geometry property to avoid conflicts

  // Copy properties from the original line string feature to the new multi-line string feature
  multiLineStringFeature.setProperties(properties);

  return multiLineStringFeature;
}

/**
 * Clones OpenLayers features to ensure they are compatible with serialization formats like GeoJSON, GPX, and KML.
 * Circle features are converted to polygon features and center point features, as these formats do not support circles.
 * Other feature types are cloned as is.
 */
export function cloneToSerializationCompatibleFeatures(
  features: Feature<Geometry>[],
  options: {
    circlesTo?: "Polygon" | "LineString" | "MultiLineString";
    polygonsTo?: "LineString" | "MultiLineString";
    lineStringsTo?: "LineString" | "MultiLineString";
    copyPointStyle?: boolean;
  } = {},
): Feature<Geometry>[] {
  const clonedFeatures: Feature<Geometry>[] = [];

  for (const feature of features) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      continue;
    }

    if (geometry.getType() === "Circle" && options.circlesTo === "Polygon") {
      // Convert circle to polygon and center point
      const [polygonFeature, centerFeature] = convertCircleToPolygon(feature);
      clonedFeatures.push(polygonFeature, centerFeature);
      continue; // Skip adding the original circle feature
    }

    if (geometry.getType() === "Circle" && options.circlesTo === "LineString") {
      // Convert circle to line string and center point
      const [lineStringFeature, centerFeature] =
        convertCircleToLineString(feature);
      clonedFeatures.push(lineStringFeature, centerFeature);
      continue; // Skip adding the original circle feature
    }

    if (
      geometry.getType() === "Circle" &&
      options.circlesTo === "MultiLineString"
    ) {
      // Convert circle to multi-line string and center point
      const [multiLineStringFeature, centerFeature] =
        convertCircleToMultiLineString(feature);
      clonedFeatures.push(multiLineStringFeature, centerFeature);
      continue; // Skip adding the original circle feature
    }

    if (
      geometry.getType() === "Polygon" &&
      options.polygonsTo === "LineString"
    ) {
      const lineStringFeature = convertPolygonToLineString(feature);
      clonedFeatures.push(lineStringFeature);
      continue; // Skip adding the original polygon feature
    }

    if (
      geometry.getType() === "Polygon" &&
      options.polygonsTo === "MultiLineString"
    ) {
      const multiLineStringFeature = convertPolygonToMultiLineString(feature);
      clonedFeatures.push(multiLineStringFeature);
      continue; // Skip adding the original polygon feature
    }

    if (
      geometry.getType() === "LineString" &&
      options.lineStringsTo === "MultiLineString"
    ) {
      const multiLineStringFeature =
        convertLineStringToMultiLineString(feature);
      clonedFeatures.push(multiLineStringFeature);
      continue; // Skip adding the original line string feature
    }

    // Clone the feature as is
    const clonedFeature = new Feature<Geometry>(geometry.clone());
    const properties = feature.getProperties();
    delete properties.geometry;
    clonedFeature.setProperties(properties);
    if (geometry.getType() === "Point" && options.copyPointStyle) {
      clonedFeature.setStyle(feature.getStyle());
    }
    clonedFeatures.push(clonedFeature);
  }

  return clonedFeatures;
}
