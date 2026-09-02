import type { FeatureLike } from "ol/Feature";
import type { StyleFunction } from "ol/style/Style";

import { Fill, Icon, Stroke, Style, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";

import type {
  IconSize,
  RelativePlacement,
  TextSize,
} from "./drawingStyleCommon";

import { useIconsStore } from "../stores/icons.store";
import { DESCRIPTION_KEY, TITLE_KEY } from "./drawingMetadata";
import {
  EDITING_OUTLINE_COLOR,
  EDITING_OUTLINE_WIDTH,
  EDITING_POINT_COLOR,
  EDITING_POINT_RADIUS,
  ICON_SIZE,
  ICON_SIZE_KEY,
  SHOW_TITLE_KEY,
  SHOW_DESCRIPTION_KEY,
  ICON_ANCHOR_KEY,
  TEXT_COLOR_KEY,
  TEXT_HALO_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE_KEY,
  TEXT_SIZE,
  ICON_SET_NAME_KEY,
  ICON_NAME_KEY,
  ICON_COLOR_KEY,
  SHOW_ICON_KEY,
  ICON_URL_KEY,
  FEATURE_FONT,
} from "./drawingStyleCommon";

/**
 * The alignment of the text depends of its placement relative to the point.
 * For example, if the text is placed to the east of the point, it should be left-aligned so that it starts at the point and extends to the right.
 */
function getTextAlign(
  textPlacement: RelativePlacement,
): "left" | "center" | "right" {
  if (textPlacement.includes("east")) {
    return "left";
  }
  if (textPlacement.includes("west")) {
    return "right";
  }
  return "center";
}

const TEXT_ICON_PADDING = 4;

function getTextBlockHeight(text: string, fontSize: number): number {
  return text.split("\n").length * fontSize;
}

/**
 * Note: points are basically never in editing mode because they go from non-existing to already created and in selected mode.
 */
export const POINT_EDITING_STYLE: StyleFunction = (_feature: FeatureLike) => {
  return [
    // Vertices showing as small circles with an outline
    new Style({
      image: new CircleStyle({
        radius: EDITING_POINT_RADIUS,
        fill: new Fill({
          color: EDITING_POINT_COLOR,
        }),
        stroke: new Stroke({
          color: EDITING_OUTLINE_COLOR,
          width: EDITING_OUTLINE_WIDTH,
        }),
      }),
    }),
  ];
};

export const POINT_SELECTED_STYLE = (feature: FeatureLike) => {
  const props = feature.getProperties();

  const showIcon = props[SHOW_ICON_KEY];
  const iconSize: IconSize = props[ICON_SIZE_KEY]; // Default to "medium" if not set
  const iconAnchor: [number, number] | undefined = props[ICON_ANCHOR_KEY];
  const iconSizePixel = showIcon ? ICON_SIZE[iconSize] : 0; // Multiply by 2 to get the diameter
  const showTitle = props[SHOW_TITLE_KEY] && props[TITLE_KEY];
  const showDescription = props[SHOW_DESCRIPTION_KEY] && props[DESCRIPTION_KEY];

  let icon;
  let titleText;
  let descriptionText;

  if (showIcon) {
    const iconSetInstance = useIconsStore().getIconSetByName(
      props[ICON_SET_NAME_KEY],
    );
    const iconInstance = iconSetInstance?.getIconByName(props[ICON_NAME_KEY]);

    // If a drawing is straight loaded from a distant KML (eg. shared from the geo admin) it may contain a hardcoded icon URL.
    // If present, this is the one being used.
    const iconUrl =
      props[ICON_URL_KEY] ||
      iconInstance?.getUrl({ color: props[ICON_COLOR_KEY] });

    if (iconUrl) {
      icon = new Icon({
        anchor: iconAnchor,
        displacement: [0, 0],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        width: iconSizePixel * 2,
        height: iconSizePixel * 2,
        src: iconUrl,
      });
    }
  }

  if (showTitle || showDescription) {
    const textSize: TextSize = props[TEXT_SIZE_KEY];
    const textSizePixel = TEXT_SIZE[textSize];
    const descriptionSizePixel = textSizePixel * 0.75;
    const textFill = new Fill({ color: props[TEXT_COLOR_KEY] });
    const textStroke = new Stroke({
      color: props[TEXT_HALO_COLOR_KEY],
      width: Math.max(3, textSizePixel * 0.2),
    });
    const textPlacement: RelativePlacement = props[TEXT_PLACEMENT_KEY];
    const textAlign = getTextAlign(textPlacement);
    const [anchorX, anchorY] = iconAnchor ?? [0.5, 0.5];
    const iconDiameter = iconSizePixel * 2;

    // Compute the text height for the title and description text based on the icon size,
    // text placement, and whether both title and description are shown.
    const titleHeight = showTitle
      ? getTextBlockHeight(props[TITLE_KEY], textSizePixel)
      : 0;
    const descriptionHeight = showDescription
      ? getTextBlockHeight(props[DESCRIPTION_KEY], descriptionSizePixel)
      : 0;

    // Compute the horizontal offset for the text based on the icon size, text placement,
    // and whether both title and description are shown.
    const offsetX = textPlacement.includes("east")
      ? (1 - anchorX) * iconDiameter + TEXT_ICON_PADDING
      : textPlacement.includes("west")
        ? -(anchorX * iconDiameter + TEXT_ICON_PADDING)
        : 0;

    // Compute the vertical offset for the text based on the icon size, text placement,
    // and whether both title and description are shown.
    const contentBelowAnchor =
      showTitle && showDescription
        ? 2 + descriptionHeight
        : (titleHeight || descriptionHeight) / 2;

    // Compute the vertical offset for the text based on the icon size, text placement,
    // and whether both title and description are shown.
    const contentAboveAnchor =
      showTitle && showDescription
        ? titleHeight
        : (titleHeight || descriptionHeight) / 2;

    // Compute the vertical offset for the text based on the icon size, text placement,
    // and whether both title and description are shown.
    const offsetY = textPlacement.includes("north")
      ? -(anchorY * iconDiameter + TEXT_ICON_PADDING + contentBelowAnchor)
      : textPlacement.includes("south")
        ? (1 - anchorY) * iconDiameter + TEXT_ICON_PADDING + contentAboveAnchor
        : 0;

    if (showTitle) {
      titleText = new Text({
        text: props[TITLE_KEY],
        font: `bold ${textSizePixel}px ${FEATURE_FONT}`,
        fill: textFill,
        stroke: textStroke,
        textAlign,
        offsetX,
        offsetY,
        // If a description is also shown, the title is aligned to the bottom of the text box
        // so that a multiline description does not overlap with the title
        textBaseline: showDescription ? "bottom" : "middle",
      });
    }

    if (showDescription) {
      descriptionText = new Text({
        text: props[DESCRIPTION_KEY],
        font: `${descriptionSizePixel}px ${FEATURE_FONT}`,
        fill: textFill,
        stroke: textStroke,
        textAlign,
        offsetX,
        // If a title comes on top of the description, then the description is aligned to the top of
        // the text box so that a multiline title does not overlap with the description
        textBaseline: showTitle ? "top" : "middle",
        offsetY: offsetY + (showTitle ? 2 : 0),
      });
    }
  }

  return [
    ...(showIcon ? [new Style({ image: icon })] : []),
    ...(titleText ? [new Style({ text: titleText })] : []),
    ...(descriptionText ? [new Style({ text: descriptionText })] : []),
  ];
};

/**
 * The style function for points in non-editing mode.
 * This style is driven by the properties of the feature,
 * which are initialized with default values when the feature is created, and can be modified by the user.
 */
export const POINT_IDLE_STYLE: StyleFunction = POINT_SELECTED_STYLE;
