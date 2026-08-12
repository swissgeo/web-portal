import type { Geometry } from "ol/geom";

import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import type { IconApiDescription } from "@/core/Icon";
import type { IconSetApiDescription } from "@/core/IconSet";

import { Icon } from "@/core/Icon";
import { IconSet } from "@/core/IconSet";
import { DEFAULT_ICON_SET_NAME, useIconsStore } from "@/stores/icons.store";
import {
  getFeatureStyleProperty,
  getIconAnchorStyleProperty,
  getIconColorStyleProperty,
  getIconNameStyleProperty,
  getIconSetNameStyleProperty,
  getIconSizeStyleProperty,
  getIconUrlStyleProperty,
  getShowDescriptionStyleProperty,
  getShowIconStyleProperty,
  getShowTitleStyleProperty,
  getTextAlignStyleProperty,
  getTextBaselineStyleProperty,
  getTextColorStyleProperty,
  getTextHaloColorStyleProperty,
  getTextPlacementStyleProperty,
  getTextSizeStyleProperty,
  ICON_ANCHOR_KEY,
  ICON_COLOR_KEY,
  ICON_NAME_KEY,
  ICON_SET_NAME_KEY,
  ICON_SIZE_KEY,
  ICON_URL_KEY,
  initializeStyleProperties,
  setIconAnchorStyleProperty,
  setIconColorStyleProperty,
  setIconNameStyleProperty,
  setIconSetNameStyleProperty,
  setIconSizeStyleProperty,
  setIconUrlStyleProperty,
  setShowDescriptionStyleProperty,
  setShowIconStyleProperty,
  setShowTitleStyleProperty,
  setTextAlignStyleProperty,
  setTextBaselineStyleProperty,
  setTextColorStyleProperty,
  setTextHaloColorStyleProperty,
  setTextPlacementStyleProperty,
  setTextSizeStyleProperty,
  SHOW_DESCRIPTION_KEY,
  SHOW_ICON_KEY,
  SHOW_TITLE_KEY,
  TEXT_ALIGN_KEY,
  TEXT_BASELINE_KEY,
  TEXT_COLOR_KEY,
  TEXT_HALO_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE_KEY,
} from "@/utils/drawingStyleCommon";

function makeFeature() {
  return new Feature<Geometry>(new Point([0, 0]));
}

function installDefaultIcon() {
  const iconSetPayload: IconSetApiDescription = {
    colorable: true,
    has_description: false,
    icons_url: "https://icons.test/default.json",
    language: null,
    name: DEFAULT_ICON_SET_NAME,
    template_url: "https://icons.test/template.png",
  };
  const iconPayload: IconApiDescription = {
    anchor: [0.25, 1],
    description: null,
    icon_set: DEFAULT_ICON_SET_NAME,
    name: "pin",
    size: [32, 32],
    template_url: "https://icons.test/{icon_name}.png",
    url: "https://icons.test/pin.png",
  };
  const iconSet = new IconSet(iconSetPayload);
  const icon = new Icon(iconPayload);
  icon.setIconSetInstance(iconSet);
  iconSet.icons.push(icon);
  useIconsStore().iconSets.push(iconSet);
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("point style properties", () => {
  it("initializes every point styling default from the default icon set", () => {
    installDefaultIcon();
    const feature = makeFeature();

    initializeStyleProperties(feature);

    expect(feature.getProperties()).toMatchObject({
      [ICON_URL_KEY]: null,
      [ICON_SET_NAME_KEY]: DEFAULT_ICON_SET_NAME,
      [ICON_COLOR_KEY]: "#ff0000",
      [ICON_NAME_KEY]: "pin",
      [SHOW_TITLE_KEY]: false,
      [SHOW_DESCRIPTION_KEY]: false,
      [SHOW_ICON_KEY]: true,
      [ICON_SIZE_KEY]: "small",
      [ICON_ANCHOR_KEY]: [0.25, 1],
      [TEXT_BASELINE_KEY]: "middle",
      [TEXT_ALIGN_KEY]: "center",
      [TEXT_COLOR_KEY]: "#000000",
      [TEXT_HALO_COLOR_KEY]: "#FFFFFF",
      [TEXT_SIZE_KEY]: "medium",
      [TEXT_PLACEMENT_KEY]: "north",
    });
  });

  it("sets and reads every icon and text property", () => {
    const feature = makeFeature();

    setIconUrlStyleProperty(feature, "https://icons.test/custom.png");
    setIconSetNameStyleProperty(feature, "transport");
    setIconNameStyleProperty(feature, "station");
    setIconColorStyleProperty(feature, "#123456");
    setShowTitleStyleProperty(feature, true);
    setShowDescriptionStyleProperty(feature, true);
    setShowIconStyleProperty(feature, false);
    setIconSizeStyleProperty(feature, "xlarge");
    setIconAnchorStyleProperty(feature, [0.25, 0.75]);
    setTextBaselineStyleProperty(feature, "bottom");
    setTextAlignStyleProperty(feature, "right");
    setTextColorStyleProperty(feature, "#abcdef");
    setTextHaloColorStyleProperty(feature, "#fedcba");
    setTextSizeStyleProperty(feature, "large");
    setTextPlacementStyleProperty(feature, "south-west");

    expect(getIconUrlStyleProperty(feature)).toBe(
      "https://icons.test/custom.png",
    );
    expect(getIconSetNameStyleProperty(feature)).toBe("transport");
    expect(getIconNameStyleProperty(feature)).toBe("station");
    expect(getIconColorStyleProperty(feature)).toBe("#123456");
    expect(getShowTitleStyleProperty(feature)).toBe(true);
    expect(getShowDescriptionStyleProperty(feature)).toBe(true);
    expect(getShowIconStyleProperty(feature)).toBe(false);
    expect(getIconSizeStyleProperty(feature)).toBe("xlarge");
    expect(getIconAnchorStyleProperty(feature)).toEqual([0.25, 0.75]);
    expect(getTextBaselineStyleProperty(feature)).toBe("bottom");
    expect(getTextAlignStyleProperty(feature)).toBe("right");
    expect(getTextColorStyleProperty(feature)).toBe("#abcdef");
    expect(getTextHaloColorStyleProperty(feature)).toBe("#fedcba");
    expect(getTextSizeStyleProperty(feature)).toBe("large");
    expect(getTextPlacementStyleProperty(feature)).toBe("south-west");
  });

  it("rejects invalid constrained values", () => {
    const feature = makeFeature();
    feature.set(ICON_SIZE_KEY, "huge");
    feature.set(TEXT_SIZE_KEY, "tiny");
    feature.set(TEXT_PLACEMENT_KEY, "over-there");
    feature.set(ICON_ANCHOR_KEY, [0.5]);

    expect(getIconSizeStyleProperty(feature)).toBeNull();
    expect(getTextSizeStyleProperty(feature)).toBeNull();
    expect(getTextPlacementStyleProperty(feature)).toBeNull();
    expect(getIconAnchorStyleProperty(feature)).toBeNull();
  });

  it("handles null features without throwing or returning values", () => {
    expect(getFeatureStyleProperty(null, ICON_NAME_KEY)).toBeNull();
    expect(() => setIconNameStyleProperty(null, "ignored")).not.toThrow();
    expect(() => setShowIconStyleProperty(null, true)).not.toThrow();
    expect(() => initializeStyleProperties(null)).not.toThrow();
  });
});
