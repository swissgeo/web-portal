import type { Feature } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Circle, Geometry, LineString, Point, Polygon } from "ol/geom";
import type { Style } from "ol/style";

import IconStyle from "ol/style/Icon";

import { rgbaToHex } from "../core/color";
import { DEFAULT_ICON_SET_NAME, useIconsStore } from "../stores/icons.store";
import {
  CIRCLE_EDITING_STYLE,
  CIRCLE_IDLE_STYLE,
  CIRCLE_SELECTED_STYLE,
} from "./circleStyle";
import { DESCRIPTION_KEY, TITLE_KEY } from "./drawingMetadata";
import {
  LINESTRING_EDITING_STYLE,
  LINESTRING_IDLE_STYLE,
  LINESTRING_SELECTED_STYLE,
} from "./lineStringStyle";
import {
  POINT_EDITING_STYLE,
  POINT_IDLE_STYLE,
  POINT_SELECTED_STYLE,
} from "./pointStyle";
import {
  POLYGON_EDITING_STYLE,
  POLYGON_IDLE_STYLE,
  POLYGON_SELECTED_STYLE,
} from "./polygonStyle";

/**
 * names of the properties used to store the style information in the feature's properties
 */
export const FILL_COLOR_KEY = "sg_fillColor";
export const STROKE_COLOR_KEY = "sg_strokeColor";
export const STROKE_WIDTH_KEY = "sg_strokeWidth";
export const POINT_RADIUS_KEY = "sg_pointRadius";
export const POINT_COLOR_KEY = "sg_pointColor";

export const ICON_SIZE = {
  xsmall: 8,
  small: 12,
  medium: 16,
  large: 24,
  xlarge: 32,
} as const;

export type IconSize = keyof typeof ICON_SIZE;

export const TEXT_SIZE = {
  xsmall: 12,
  small: 15,
  medium: 22,
  large: 30,
  xlarge: 36,
} as const;

export type TextSize = keyof typeof TEXT_SIZE;

export const RELATIVE_PLACEMENT = [
  "north",
  "center",
  "south",
  "east",
  "west",
  "north-east",
  "north-west",
  "south-east",
  "south-west",
];

export type RelativePlacement = (typeof RELATIVE_PLACEMENT)[number];

export const FEATURE_FONT = "Helvetica";

/**
 * Properties specific to icon/label styling, initially only used for point geometries,
 * but could be extended to other geometries in the future.
 */
export const ICON_URL_KEY = "sg_iconUrl";
export const SHOW_TITLE_KEY = "sg_showTitle";
export const SHOW_DESCRIPTION_KEY = "sg_showDescription";
export const SHOW_ICON_KEY = "sg_showIcon";
export const ICON_SET_NAME_KEY = "sg_iconSetName"; // name of the icon set used for the icon
export const ICON_NAME_KEY = "sg_iconName"; // name of the icon within the icon set
export const ICON_COLOR_KEY = "sg_iconColor"; // color of the icon, if the icon set supports colorization
export const ICON_SIZE_KEY = "sg_iconSize"; // "xsmall", "small", "medium", "large", "xlarge"
export const ICON_ANCHOR_KEY = "sg_iconAnchor"; // [0.5, 0.5] for center, [0, 0] for top-left, [1, 1] for bottom-right, etc.
export const TEXT_BASELINE_KEY = "sg_textBaseline"; // "top", "middle", "bottom"
export const TEXT_SIZE_KEY = "sg_textSize"; // "xsmall", "small", "medium", "large", "xlarge"
export const TEXT_ALIGN_KEY = "sg_textAlign"; // "left", "center", "right"
export const TEXT_COLOR_KEY = "sg_textColor"; // color of the text
export const TEXT_HALO_COLOR_KEY = "sg_textHaloColor"; // color of the text halo
export const TEXT_PLACEMENT_KEY = "sg_textPlacement"; // "north", "center", "south", "east", "west", "north-east", "north-west", "south-east", "south-west"

// Examples:
// https://openlayers.org/en/latest/examples/icon-scale.html
// https://openlayers.org/en/latest/examples/icon.html

/**
 * The style as exchanged between the drawing composable and the UI for editing the style of a feature.
 */
export type FeatureStyle = {
  [FILL_COLOR_KEY]?: string;
  [STROKE_COLOR_KEY]?: string;
  [STROKE_WIDTH_KEY]?: number;
  [POINT_RADIUS_KEY]?: number;
  [POINT_COLOR_KEY]?: string;
};

export const DEFAULT_HEX_FILL_ALPHA = "4d";

/**
 * Default values for the style properties.
 * Note: these are not for the style "as creating/editing" but for the initial style of a feature when it is created.
 */
export const DEFAULT_STROKE_COLOR = "#ff0000";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_FILL_COLOR = "#ff0000";
export const DEFAULT_POINT_RADIUS = 4;
export const DEFAULT_POINT_COLOR = "#ff0000";

/**
 * Style of the feature when it is being created or edited.
 * This is used to give a visual feedback to the user that the feature is in an
 * intermediate state and not yet finalized.
 */
export const EDITING_STROKE_COLOR = "#ff8800";
export const EDITING_STROKE_WIDTH = 2;
export const EDITING_FILL_COLOR = "#ffaa00";
export const EDITING_OUTLINE_WIDTH = 2;
export const EDITING_POINT_COLOR = "#ff8800";
export const EDITING_POINT_RADIUS =
  1 + DEFAULT_POINT_RADIUS + EDITING_OUTLINE_WIDTH / 2;
export const EDITING_OUTLINE_COLOR = "#FFFFFF";

export const SELECTED_OUTLINE_WIDTH = 2;
export const SELECTED_POINT_RADIUS =
  1 + DEFAULT_POINT_RADIUS + SELECTED_OUTLINE_WIDTH / 2;
export const SELECTED_OUTLINE_COLOR = "#FFFFFF";

export function initializeStylePropertiesPolygonGeometry(
  feature: Feature<Polygon>,
) {
  feature.setProperties({
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
    [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
  });
}

export function initializeStylePropertiesLineStringGeometry(
  feature: Feature<LineString>,
) {
  feature.setProperties({
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
  });
}

export function initializeStylePropertiesCircleGeometry(
  feature: Feature<Circle>,
) {
  feature.setProperties({
    [STROKE_COLOR_KEY]: DEFAULT_STROKE_COLOR,
    [STROKE_WIDTH_KEY]: DEFAULT_STROKE_WIDTH,
    [FILL_COLOR_KEY]: DEFAULT_FILL_COLOR,
  });
}

export function initializeStylePropertiesPointGeometry(
  feature: Feature<Point>,
) {
  const defaultIconSet = useIconsStore().getDefaultIconSet();
  const defaultIcon = defaultIconSet?.icons[0];

  // inspo: https://openlayers.org/en/latest/examples/kml-earthquakes.html
  feature.setProperties({
    [POINT_RADIUS_KEY]: DEFAULT_POINT_RADIUS,
    [POINT_COLOR_KEY]: DEFAULT_POINT_COLOR,
    [ICON_URL_KEY]: null,
    [ICON_SET_NAME_KEY]: DEFAULT_ICON_SET_NAME,
    [ICON_COLOR_KEY]: "#ff0000",
    [ICON_NAME_KEY]: defaultIcon?.name,
    [SHOW_TITLE_KEY]: false,
    [SHOW_DESCRIPTION_KEY]: false,
    [SHOW_ICON_KEY]: true,
    [ICON_SIZE_KEY]: "small",
    [ICON_ANCHOR_KEY]: defaultIcon?.anchor,
    [TEXT_BASELINE_KEY]: "middle",
    [TEXT_ALIGN_KEY]: "center",
    [TEXT_COLOR_KEY]: "#000000",
    [TEXT_HALO_COLOR_KEY]: "#FFFFFF",
    [TEXT_SIZE_KEY]: "medium",
    [TEXT_PLACEMENT_KEY]: "north",
  });
}

/**
 * Adds the necessary properties to the feature to store the style information, with default values.
 */
export function initializeStyleProperties(feature: Feature<Geometry> | null) {
  if (!feature) {
    return;
  }
  switch (feature.getGeometry()?.getType()) {
    case "Point":
      initializeStylePropertiesPointGeometry(feature as Feature<Point>);
      break;
    case "LineString":
      initializeStylePropertiesLineStringGeometry(
        feature as Feature<LineString>,
      );
      break;
    case "Polygon":
      initializeStylePropertiesPolygonGeometry(feature as Feature<Polygon>);
      break;
    case "Circle":
      initializeStylePropertiesCircleGeometry(feature as Feature<Circle>);
      break;
  }
}

/**
 * Apply the creating/editing style to a feature
 */
export function applyEditingStyle(feature: Feature<Geometry> | null) {
  if (!feature) {
    return;
  }
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  switch (feature.getGeometry()?.getType()) {
    case "Point":
      feature.setStyle(POINT_EDITING_STYLE);
      break;
    case "LineString":
      feature.setStyle(LINESTRING_EDITING_STYLE);
      break;
    case "Polygon":
      feature.setStyle(POLYGON_EDITING_STYLE);
      break;
    case "Circle":
      feature.setStyle(CIRCLE_EDITING_STYLE);
      break;
  }
}

export function applyIdleStyle(feature: Feature<Geometry> | null) {
  if (!feature) {
    return;
  }
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  switch (feature.getGeometry()?.getType()) {
    case "Point":
      feature.setStyle(POINT_IDLE_STYLE);
      break;
    case "LineString":
      feature.setStyle(LINESTRING_IDLE_STYLE);
      break;
    case "Polygon":
      feature.setStyle(POLYGON_IDLE_STYLE);
      break;
    case "Circle":
      feature.setStyle(CIRCLE_IDLE_STYLE);
      break;
  }
}

export function applySelectedStyle(feature: Feature<Geometry> | null) {
  if (!feature) {
    return;
  }
  const geometry = feature.getGeometry();
  if (!geometry) {
    return;
  }

  switch (feature.getGeometry()?.getType()) {
    case "Point":
      feature.setStyle(POINT_SELECTED_STYLE);
      break;
    case "LineString":
      feature.setStyle(LINESTRING_SELECTED_STYLE);
      break;
    case "Polygon":
      feature.setStyle(POLYGON_SELECTED_STYLE);
      break;
    case "Circle":
      feature.setStyle(CIRCLE_SELECTED_STYLE);
      break;
  }
}

/**
 * From a given feature, extract the style-related properties and return them as an object.
 * Note: depending on the type of geometry, some properties may be undefined, as they are not relevant for that type of geometry.
 */
export function getStylePropertiesAsObject(
  feature: Feature<Geometry>,
): FeatureStyle {
  return {
    [FILL_COLOR_KEY]: feature.get(FILL_COLOR_KEY),
    [STROKE_COLOR_KEY]: feature.get(STROKE_COLOR_KEY),
    [STROKE_WIDTH_KEY]: feature.get(STROKE_WIDTH_KEY),
    [POINT_RADIUS_KEY]: feature.get(POINT_RADIUS_KEY),
    [POINT_COLOR_KEY]: feature.get(POINT_COLOR_KEY),
  };
}

function setFeatureStyleProperty(
  feature: Feature<Geometry> | null,
  key: string,
  value: unknown,
) {
  if (!feature) {
    return;
  }
  feature.set(key, value);
}

export function getFeatureStyleProperty(
  feature: FeatureLike | null,
  key: string,
): null | string | number | boolean {
  if (!feature) {
    return null;
  }
  return feature.get(key) ?? null;
}

export function setFeatureFillColorStyleProperty(
  feature: Feature<Geometry> | null,
  color: string,
) {
  setFeatureStyleProperty(feature, FILL_COLOR_KEY, color);
}

export function getFeatureFillColorStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const color = getFeatureStyleProperty(feature, FILL_COLOR_KEY);
  return typeof color === "string" ? color : null;
}

export function setFeatureStrokeColorStyleProperty(
  feature: Feature<Geometry> | null,
  color: string,
) {
  setFeatureStyleProperty(feature, STROKE_COLOR_KEY, color);
}

export function getFeatureStrokeColorStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const color = getFeatureStyleProperty(feature, STROKE_COLOR_KEY);
  return typeof color === "string" ? color : null;
}

export function setFeatureStrokeWidthStyleProperty(
  feature: Feature<Geometry> | null,
  width: number,
) {
  setFeatureStyleProperty(feature, STROKE_WIDTH_KEY, width);
}

export function getFeatureStrokeWidthStyleProperty(
  feature: Feature<Geometry> | null,
): number | null {
  const width = getFeatureStyleProperty(feature, STROKE_WIDTH_KEY);
  return typeof width === "number" ? width : null;
}

export function setFeaturePointRadiusStyleProperty(
  feature: Feature<Geometry> | null,
  radius: number,
) {
  setFeatureStyleProperty(feature, POINT_RADIUS_KEY, radius);
}

export function getFeaturePointRadiusStyleProperty(
  feature: Feature<Geometry> | null,
): number | null {
  const radius = getFeatureStyleProperty(feature, POINT_RADIUS_KEY);
  return typeof radius === "number" ? radius : null;
}

export function setFeaturePointColorStyleProperty(
  feature: Feature<Geometry> | null,
  color: string,
) {
  setFeatureStyleProperty(feature, POINT_COLOR_KEY, color);
}

export function getFeaturePointColorStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const color = getFeatureStyleProperty(feature, POINT_COLOR_KEY);
  return typeof color === "string" ? color : null;
}

export function setIconUrlStyleProperty(
  feature: Feature<Geometry> | null,
  url: string,
) {
  setFeatureStyleProperty(feature, ICON_URL_KEY, url);
}

export function setIconNameStyleProperty(
  feature: Feature<Geometry> | null,
  name: string,
) {
  setFeatureStyleProperty(feature, ICON_NAME_KEY, name);
}

export function getIconNameStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const name = getFeatureStyleProperty(feature, ICON_NAME_KEY);
  return typeof name === "string" ? name : null;
}

export function setIconSetNameStyleProperty(
  feature: Feature<Geometry> | null,
  name: string,
) {
  setFeatureStyleProperty(feature, ICON_SET_NAME_KEY, name);
}

export function getIconSetNameStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const name = getFeatureStyleProperty(feature, ICON_SET_NAME_KEY);
  return typeof name === "string" ? name : null;
}

export function getIconUrlStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const url = getFeatureStyleProperty(feature, ICON_URL_KEY);
  return typeof url === "string" ? url : null;
}

export function setIconColorStyleProperty(
  feature: Feature<Geometry> | null,
  color: string,
) {
  setFeatureStyleProperty(feature, ICON_COLOR_KEY, color);
}

export function getIconColorStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const color = getFeatureStyleProperty(feature, ICON_COLOR_KEY);
  return typeof color === "string" ? color : null;
}

export function setShowTitleStyleProperty(
  feature: Feature<Geometry> | null,
  showTitle: boolean,
) {
  setFeatureStyleProperty(feature, SHOW_TITLE_KEY, showTitle);
}

export function getShowTitleStyleProperty(
  feature: Feature<Geometry> | null,
): boolean | null {
  const showTitle = getFeatureStyleProperty(feature, SHOW_TITLE_KEY);
  return typeof showTitle === "boolean" ? showTitle : null;
}

export function setShowDescriptionStyleProperty(
  feature: Feature<Geometry> | null,
  showDescription: boolean,
) {
  setFeatureStyleProperty(feature, SHOW_DESCRIPTION_KEY, showDescription);
}

export function getShowDescriptionStyleProperty(
  feature: Feature<Geometry> | null,
): boolean | null {
  const showDescription = getFeatureStyleProperty(
    feature,
    SHOW_DESCRIPTION_KEY,
  );
  return typeof showDescription === "boolean" ? showDescription : null;
}

export function setShowIconStyleProperty(
  feature: Feature<Geometry> | null,
  showIcon: boolean,
) {
  setFeatureStyleProperty(feature, SHOW_ICON_KEY, showIcon);
}

export function getShowIconStyleProperty(
  feature: Feature<Geometry> | null,
): boolean | null {
  const showIcon = getFeatureStyleProperty(feature, SHOW_ICON_KEY);
  return typeof showIcon === "boolean" ? showIcon : null;
}

export function setIconSizeStyleProperty(
  feature: Feature<Geometry> | null,
  size: IconSize,
) {
  setFeatureStyleProperty(feature, ICON_SIZE_KEY, size);
}

export function getIconSizeStyleProperty(
  feature: Feature<Geometry> | null,
): IconSize | null {
  const size = getFeatureStyleProperty(feature, ICON_SIZE_KEY);
  return typeof size === "string" && size in ICON_SIZE
    ? (size as IconSize)
    : null;
}

export function setIconAnchorStyleProperty(
  feature: Feature<Geometry> | null,
  iconAnchor: [number, number],
) {
  setFeatureStyleProperty(feature, ICON_ANCHOR_KEY, iconAnchor);
}

export function getIconAnchorStyleProperty(
  feature: Feature<Geometry> | null,
): [number, number] | null {
  const iconAnchor = getFeatureStyleProperty(feature, ICON_ANCHOR_KEY);
  return Array.isArray(iconAnchor) && iconAnchor.length === 2
    ? (iconAnchor as unknown as [number, number])
    : null;
}

export function setTextBaselineStyleProperty(
  feature: Feature<Geometry> | null,
  textBaseline: "top" | "middle" | "bottom",
) {
  setFeatureStyleProperty(feature, TEXT_BASELINE_KEY, textBaseline);
}

export function getTextBaselineStyleProperty(
  feature: Feature<Geometry> | null,
): "top" | "middle" | "bottom" | null {
  const textBaseline = getFeatureStyleProperty(feature, TEXT_BASELINE_KEY);
  return typeof textBaseline === "string"
    ? (textBaseline as "top" | "middle" | "bottom")
    : null;
}

export function setTextAlignStyleProperty(
  feature: Feature<Geometry> | null,
  textAlign: "left" | "center" | "right",
) {
  setFeatureStyleProperty(feature, TEXT_ALIGN_KEY, textAlign);
}

export function getTextAlignStyleProperty(
  feature: Feature<Geometry> | null,
): "left" | "center" | "right" | null {
  const textAlign = getFeatureStyleProperty(feature, TEXT_ALIGN_KEY);
  return typeof textAlign === "string"
    ? (textAlign as "left" | "center" | "right")
    : null;
}

export function setTextColorStyleProperty(
  feature: Feature<Geometry> | null,
  textColor: string,
) {
  setFeatureStyleProperty(feature, TEXT_COLOR_KEY, textColor);
}

export function getTextColorStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const textColor = getFeatureStyleProperty(feature, TEXT_COLOR_KEY);
  return typeof textColor === "string" ? textColor : null;
}

export function setTextHaloColorStyleProperty(
  feature: Feature<Geometry> | null,
  textHaloColor: string,
) {
  setFeatureStyleProperty(feature, TEXT_HALO_COLOR_KEY, textHaloColor);
}

export function getTextHaloColorStyleProperty(
  feature: Feature<Geometry> | null,
): string | null {
  const textHaloColor = getFeatureStyleProperty(feature, TEXT_HALO_COLOR_KEY);
  return typeof textHaloColor === "string" ? textHaloColor : null;
}

export function setTextSizeStyleProperty(
  feature: Feature<Geometry> | null,
  textSize: TextSize,
) {
  setFeatureStyleProperty(feature, TEXT_SIZE_KEY, textSize);
}

export function getTextSizeStyleProperty(
  feature: Feature<Geometry> | null,
): TextSize | null {
  const textSize = getFeatureStyleProperty(feature, TEXT_SIZE_KEY);
  return typeof textSize === "string" && textSize in TEXT_SIZE
    ? (textSize as TextSize)
    : null;
}

export function setTextPlacementStyleProperty(
  feature: Feature<Geometry> | null,
  textPlacement: RelativePlacement,
) {
  setFeatureStyleProperty(feature, TEXT_PLACEMENT_KEY, textPlacement);
}

export function getTextPlacementStyleProperty(
  feature: Feature<Geometry> | null,
): RelativePlacement | null {
  const textPlacement = getFeatureStyleProperty(feature, TEXT_PLACEMENT_KEY);
  return typeof textPlacement === "string" &&
    RELATIVE_PLACEMENT.includes(textPlacement as RelativePlacement)
    ? (textPlacement as RelativePlacement)
    : null;
}

/**
 * Read the OL style set by the KML parser on a feature and map it
 * to the app's style properties (fillColor, strokeColor, strokeWidth, etc.).
 *
 * After mapping, the OL-parsed style is cleared so the app's own
 * style functions (IDLE_STYLE, SELECTED_STYLE, etc.) take over.
 */
export function mapKmlStylesToFeatureProperties(
  feature: Feature<Geometry>,
): void {
  const rawStyle = feature.getStyle();
  if (!rawStyle) {
    return;
  }

  // OL's KML parser sets a StyleFunction, not a Style object.
  // Call it to resolve the actual styles.
  let styles: Style[];
  if (typeof rawStyle === "function") {
    const resolved = rawStyle(feature, 1) as Style | Style[];
    styles = Array.isArray(resolved) ? resolved : [resolved];
  } else {
    styles = Array.isArray(rawStyle) ? rawStyle : [rawStyle];
  }

  let style: Style | null = null;
  for (const s of styles) {
    if (s && typeof s !== "function" && typeof s.getFill === "function") {
      style = s;
      break;
    }
  }
  if (!style) {
    for (const s of styles) {
      if (s && typeof s !== "function" && typeof s.getStroke === "function") {
        style = s;
        break;
      }
    }
  }
  if (!style) {
    return;
  }

  feature.set(TITLE_KEY, feature.get("name") ?? null);
  feature.set(DESCRIPTION_KEY, feature.get("description") ?? null);

  const geomType = feature.getGeometry()?.getType();

  if (geomType === "Point") {
    convertKmlToSwissGeoPoints(feature, style);
  } else if (geomType === "LineString") {
    convertKmlToSwissGeoPolyline(feature, style);
  } else if (geomType === "Polygon") {
    convertKmlToSwissGeoPolygon(feature, style);
  }

  feature.setStyle();
}

function convertKmlToSwissGeoPolyline(
  feature: Feature<Geometry>,
  style: Style,
) {
  const stroke = style.getStroke();
  if (stroke) {
    const strokeColor = stroke.getColor();
    if (Array.isArray(strokeColor)) {
      feature.set(STROKE_COLOR_KEY, rgbaToHex(strokeColor));
    }
    if (typeof stroke.getWidth === "function") {
      feature.set(STROKE_WIDTH_KEY, stroke.getWidth());
    }
  }
}

function convertKmlToSwissGeoPolygon(feature: Feature<Geometry>, style: Style) {
  const fill = style.getFill();
  if (fill) {
    const fillColor = fill.getColor();
    if (Array.isArray(fillColor)) {
      feature.set(FILL_COLOR_KEY, rgbaToHex(fillColor));
    }
  }

  const stroke = style.getStroke();
  if (stroke) {
    const strokeColor = stroke.getColor();
    if (Array.isArray(strokeColor)) {
      feature.set(STROKE_COLOR_KEY, rgbaToHex(strokeColor));
    }
    if (typeof stroke.getWidth === "function") {
      feature.set(STROKE_WIDTH_KEY, stroke.getWidth());
    }
  }
}

/**
 * This is to convert the KML imports from share links, specifically addressing the Marker and Annotations,
 * both being turned into point in Swissgeo, but with a different behavior regarding the icon and the title.
 */
function convertKmlToSwissGeoPoints(feature: Feature<Geometry>, style: Style) {
  const image = typeof style.getImage === "function" ? style.getImage() : null;
  const text = typeof style.getText === "function" ? style.getText() : null;

  if (image instanceof IconStyle) {
    const iconUrl = image.getSrc();
    const iconSize = image.getSize();
    const iconAnchorPixel = image.getAnchor();
    const iconAnchor = [
      iconAnchorPixel[0] / (iconSize?.[0] ?? 1),
      iconAnchorPixel[1] / (iconSize?.[1] ?? 1),
    ];

    feature.set(ICON_URL_KEY, iconUrl);
    feature.set(ICON_ANCHOR_KEY, iconAnchor);

    // On Swiss Geo Admin, the shared icon scale are:
    // small: 0.5
    // medium: 0.75
    // large: 1
    // xlarge: 1.25
    const importedImgScale = image.getScale() as number;
    if (importedImgScale < 0.66) {
      feature.set(ICON_SIZE_KEY, "small");
    } else if (importedImgScale < 0.875) {
      feature.set(ICON_SIZE_KEY, "medium");
    } else if (importedImgScale < 1.125) {
      feature.set(ICON_SIZE_KEY, "large");
    } else {
      feature.set(ICON_SIZE_KEY, "xlarge");
    }
  }

  if (text) {
    // The KML parser sets the text offset as a string like "0,0" or "0,-1" or "1,1", etc.
    const relativePlacement = offsetStringToRelativePlacement(
      feature.get("textOffset"),
    );
    feature.set(TEXT_PLACEMENT_KEY, relativePlacement);

    const textFillColor = text.getFill()?.getColor();
    if (Array.isArray(textFillColor)) {
      feature.set(TEXT_COLOR_KEY, rgbaToHex(textFillColor));
    }

    const textStrokeColor = text.getStroke()?.getColor();
    if (Array.isArray(textStrokeColor)) {
      feature.set(TEXT_HALO_COLOR_KEY, rgbaToHex(textStrokeColor));
    }

    const importedTxtScale = text.getScale() as number;

    // On Swiss Geo Admin, the shared text scale are:
    // small: 0.8
    // medium: 1.5
    // large: 2.0
    // xlarge: 2.5
    if (importedTxtScale < 1.15) {
      feature.set(TEXT_SIZE_KEY, "small");
    } else if (importedTxtScale < 1.75) {
      feature.set(TEXT_SIZE_KEY, "medium");
    } else if (importedTxtScale < 2.25) {
      feature.set(TEXT_SIZE_KEY, "large");
    } else {
      feature.set(TEXT_SIZE_KEY, "xlarge");
    }
  }

  // On Swiss Geo Admin, a shared elements with a title but no icon
  // has the "type" to "annotation", while a shared element with a title and an icon is of type "marker".
  if (feature.get("type") === "marker") {
    feature.set(SHOW_ICON_KEY, true);
    feature.set(SHOW_TITLE_KEY, true);
    feature.set(
      SHOW_DESCRIPTION_KEY,
      feature.get("showDescriptionOnMap") === "true",
    );
  } else if (feature.get("type") === "annotation") {
    feature.set(SHOW_ICON_KEY, false);
    feature.set(SHOW_TITLE_KEY, true);
  }
}

function offsetStringToRelativePlacement(
  offsetString: string,
): RelativePlacement {
  if (!offsetString || typeof offsetString !== "string") {
    return "center";
  }
  const offset = offsetString.split(",");
  if (offset.length !== 2) {
    return "center";
  }
  const offsetX = parseFloat(offset[0]);
  const offsetY = parseFloat(offset[1]);

  if (offsetX === 0 && offsetY === 0) {
    return "center";
  } else if (offsetX === 0 && offsetY < 0) {
    return "north";
  } else if (offsetX === 0 && offsetY > 0) {
    return "south";
  } else if (offsetX < 0 && offsetY === 0) {
    return "west";
  } else if (offsetX > 0 && offsetY === 0) {
    return "east";
  } else if (offsetX < 0 && offsetY < 0) {
    return "north-west";
  } else if (offsetX > 0 && offsetY < 0) {
    return "north-east";
  } else if (offsetX < 0 && offsetY > 0) {
    return "south-west";
  } else if (offsetX > 0 && offsetY > 0) {
    return "south-east";
  }

  return "center";
}
