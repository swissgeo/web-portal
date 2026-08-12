import type { Geometry } from "ol/geom";
import type { Style } from "ol/style";

import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { Icon as OlIcon, Text } from "ol/style";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import type { IconApiDescription } from "@/core/Icon";
import type { IconSetApiDescription } from "@/core/IconSet";

import { Icon } from "@/core/Icon";
import { IconSet } from "@/core/IconSet";
import { useIconsStore } from "@/stores/icons.store";
import {
  DESCRIPTION_KEY,
  initializeMetadataProperties,
  TITLE_KEY,
} from "@/utils/drawingMetadata";
import {
  FEATURE_FONT,
  ICON_ANCHOR_KEY,
  ICON_COLOR_KEY,
  ICON_NAME_KEY,
  ICON_SET_NAME_KEY,
  ICON_SIZE_KEY,
  ICON_URL_KEY,
  initializeStyleProperties,
  SHOW_DESCRIPTION_KEY,
  SHOW_ICON_KEY,
  SHOW_TITLE_KEY,
  TEXT_COLOR_KEY,
  TEXT_HALO_COLOR_KEY,
  TEXT_PLACEMENT_KEY,
  TEXT_SIZE_KEY,
} from "@/utils/drawingStyleCommon";
import { POINT_SELECTED_STYLE } from "@/utils/pointStyle";

function installIconSet() {
  const iconSetPayload: IconSetApiDescription = {
    colorable: true,
    has_description: false,
    icons_url: "https://icons.test/transport.json",
    language: null,
    name: "transport",
    template_url: "https://icons.test/template.png",
  };
  const iconPayload: IconApiDescription = {
    anchor: [0.25, 0.75],
    description: null,
    icon_set: "transport",
    name: "station",
    size: [32, 32],
    template_url:
      "https://icons.test/{icon_set_name}/{icon_name}/{icon_scale}/{r}/{g}/{b}.png",
    url: "https://icons.test/transport/station.png",
  };
  const iconSet = new IconSet(iconSetPayload);
  const icon = new Icon(iconPayload);
  icon.setIconSetInstance(iconSet);
  iconSet.icons.push(icon);
  useIconsStore().iconSets.push(iconSet);
}

function makePointFeature() {
  const feature = new Feature<Geometry>(new Point([0, 0]));
  initializeStyleProperties(feature);
  initializeMetadataProperties(feature);
  feature.setProperties({
    [TITLE_KEY]: "Title",
    [DESCRIPTION_KEY]: "Description",
    [SHOW_ICON_KEY]: true,
    [SHOW_TITLE_KEY]: true,
    [SHOW_DESCRIPTION_KEY]: true,
    [ICON_SET_NAME_KEY]: "transport",
    [ICON_NAME_KEY]: "station",
    [ICON_COLOR_KEY]: "#12ab34",
    [ICON_SIZE_KEY]: "small",
    [ICON_ANCHOR_KEY]: [0.25, 0.75],
    [TEXT_SIZE_KEY]: "medium",
    [TEXT_COLOR_KEY]: "#102030",
    [TEXT_HALO_COLOR_KEY]: "#f0e0d0",
    [TEXT_PLACEMENT_KEY]: "center",
  });
  return feature;
}

function render(feature: Feature<Geometry>): Style[] {
  return POINT_SELECTED_STYLE(feature) as Style[];
}

function findText(styles: Style[], value: string): Text {
  const text = styles
    .map((style) => style.getText())
    .find((candidate) => candidate?.getText() === value);
  expect(text).toBeInstanceOf(Text);
  return text as Text;
}

beforeEach(() => {
  setActivePinia(createPinia());
  installIconSet();
});

describe("point icon rendering", () => {
  it("builds a colorized icon-service URL and applies icon dimensions", () => {
    const feature = makePointFeature();
    const [style] = render(feature);
    const image = style.getImage() as OlIcon;

    expect(image).toBeInstanceOf(OlIcon);
    expect(image.getSrc()).toBe(
      "https://icons.test/transport/station/1x/18/171/52.png",
    );
    expect(
      (
        image as unknown as {
          initialOptions_: { height: number; width: number };
        }
      ).initialOptions_,
    ).toMatchObject({ height: 24, width: 24 });
  });

  it("prefers an imported hardcoded icon URL", () => {
    const feature = makePointFeature();
    feature.set(ICON_URL_KEY, "https://geo.admin.test/imported.png");

    const [style] = render(feature);

    expect((style.getImage() as OlIcon).getSrc()).toBe(
      "https://geo.admin.test/imported.png",
    );
  });

  it("omits the icon when hidden or when no URL can be resolved", () => {
    const hidden = makePointFeature();
    hidden.set(SHOW_ICON_KEY, false);
    expect(render(hidden).some((style) => style.getImage())).toBe(false);

    const missing = makePointFeature();
    missing.set(ICON_SET_NAME_KEY, "missing");
    missing.set(ICON_NAME_KEY, "missing");
    missing.set(ICON_URL_KEY, "");
    expect(render(missing).some((style) => style.getImage())).toBe(false);
  });
});

describe("point label rendering", () => {
  it("applies font, colors, halo width, and paired baselines", () => {
    const feature = makePointFeature();
    const styles = render(feature);
    const title = findText(styles, "Title");
    const description = findText(styles, "Description");

    expect(title.getFont()).toBe(`bold 22px ${FEATURE_FONT}`);
    expect(description.getFont()).toBe(`16.5px ${FEATURE_FONT}`);
    expect(title.getFill()?.getColor()).toBe("#102030");
    expect(title.getStroke()?.getColor()).toBe("#f0e0d0");
    expect(title.getStroke()?.getWidth()).toBeCloseTo(4.4);
    expect(title.getTextBaseline()).toBe("bottom");
    expect(description.getTextBaseline()).toBe("top");
    expect(description.getOffsetY()).toBe(title.getOffsetY() + 2);
  });

  it.each([
    ["center", "center", 0, 0],
    ["east", "left", 22, 0],
    ["west", "right", -10, 0],
    ["north", "center", 0, -40.5],
    ["south", "center", 0, 32],
    ["north-east", "left", 22, -40.5],
    ["north-west", "right", -10, -40.5],
    ["south-east", "left", 22, 32],
    ["south-west", "right", -10, 32],
  ] as const)(
    "places a label at %s",
    (placement, alignment, offsetX, offsetY) => {
      const feature = makePointFeature();
      feature.set(TEXT_PLACEMENT_KEY, placement);

      const title = findText(render(feature), "Title");

      expect(title.getTextAlign()).toBe(alignment);
      expect(title.getOffsetX()).toBe(offsetX);
      expect(title.getOffsetY()).toBe(offsetY);
    },
  );

  it("uses every line when positioning multiline labels", () => {
    const feature = makePointFeature();
    feature.set(TITLE_KEY, "First\nSecond");
    feature.set(DESCRIPTION_KEY, "One\nTwo");
    feature.set(TEXT_PLACEMENT_KEY, "north");

    const styles = render(feature);
    const title = findText(styles, "First\nSecond");
    const description = findText(styles, "One\nTwo");

    expect(title.getOffsetY()).toBe(-57);
    expect(description.getOffsetY()).toBe(-55);
  });

  it("centers a single title or description on its own text block", () => {
    const titleOnly = makePointFeature();
    titleOnly.set(SHOW_DESCRIPTION_KEY, false);
    titleOnly.set(TEXT_PLACEMENT_KEY, "north");
    const title = findText(render(titleOnly), "Title");
    expect(title.getOffsetY()).toBe(-33);
    expect(title.getTextBaseline()).toBe("middle");

    const descriptionOnly = makePointFeature();
    descriptionOnly.set(SHOW_TITLE_KEY, false);
    descriptionOnly.set(TEXT_PLACEMENT_KEY, "north");
    const description = findText(render(descriptionOnly), "Description");
    expect(description.getOffsetY()).toBe(-30.25);
    expect(description.getTextBaseline()).toBe("middle");
  });

  it("does not render empty or hidden labels", () => {
    const feature = makePointFeature();
    feature.set(TITLE_KEY, "");
    feature.set(SHOW_DESCRIPTION_KEY, false);

    expect(render(feature).filter((style) => style.getText())).toEqual([]);
  });
});
