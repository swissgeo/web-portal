import type CircleStyle from "ol/style/Circle";

import { describe, expect, it } from "vitest";

import {
  INVISIBLE_POINT_FILL_COLOR,
  INVISIBLE_POINT_RADIUS,
  TEXT_FEATURE_FILL_COLOR,
  TEXT_FEATURE_FONT,
  TEXT_FEATURE_STROKE_COLOR,
  TEXT_FEATURE_STROKE_WIDTH,
  createTextFeatureStyle,
  createTextStyle,
} from "../textFeatureStyle";

describe("constants", () => {
  it("TEXT_FEATURE_FONT is 16px sans-serif", () => {
    expect(TEXT_FEATURE_FONT).toBe("16px sans-serif");
  });

  it("TEXT_FEATURE_FILL_COLOR is black", () => {
    expect(TEXT_FEATURE_FILL_COLOR).toBe("#000");
  });

  it("TEXT_FEATURE_STROKE_COLOR is white", () => {
    expect(TEXT_FEATURE_STROKE_COLOR).toBe("#fff");
  });

  it("TEXT_FEATURE_STROKE_WIDTH is 3", () => {
    expect(TEXT_FEATURE_STROKE_WIDTH).toBe(3);
  });

  it("INVISIBLE_POINT_RADIUS is 0", () => {
    expect(INVISIBLE_POINT_RADIUS).toBe(0);
  });

  it("INVISIBLE_POINT_FILL_COLOR is transparent", () => {
    expect(INVISIBLE_POINT_FILL_COLOR).toBe("rgba(0, 0, 0, 0)");
  });
});

describe("createTextStyle", () => {
  it("returns a TextStyle with the given text", () => {
    const style = createTextStyle("Hello");
    expect(style.getText()).toBe("Hello");
  });

  it("uses the shared font", () => {
    const style = createTextStyle("test");
    expect(style.getFont()).toBe(TEXT_FEATURE_FONT);
  });

  it("uses the shared fill color", () => {
    const style = createTextStyle("test");
    expect(style.getFill()?.getColor()).toBe(TEXT_FEATURE_FILL_COLOR);
  });

  it("uses the shared stroke color and width", () => {
    const style = createTextStyle("test");
    expect(style.getStroke()?.getColor()).toBe(TEXT_FEATURE_STROKE_COLOR);
    expect(style.getStroke()?.getWidth()).toBe(TEXT_FEATURE_STROKE_WIDTH);
  });

  it("centers text horizontally and vertically", () => {
    const style = createTextStyle("test");
    expect(style.getTextAlign()).toBe("center");
    expect(style.getTextBaseline()).toBe("middle");
  });

  it("sets offsetY to 0", () => {
    const style = createTextStyle("test");
    expect(style.getOffsetY()).toBe(0);
  });

  it("handles empty string", () => {
    const style = createTextStyle("");
    expect(style.getText()).toBe("");
  });
});

describe("createTextFeatureStyle", () => {
  it("returns a Style", () => {
    const style = createTextFeatureStyle("label");
    expect(style.constructor.name).toBe("Style");
  });

  it("has an invisible circle image", () => {
    const style = createTextFeatureStyle("label");
    const image = style.getImage();
    expect(image).toBeDefined();
    expect(image!.constructor.name).toBe("CircleStyle");
  });

  it("circle has radius 0", () => {
    const style = createTextFeatureStyle("label");
    const image = style.getImage() as CircleStyle;
    expect(image.getRadius()).toBe(INVISIBLE_POINT_RADIUS);
  });

  it("circle fill is transparent", () => {
    const style = createTextFeatureStyle("label");
    const image = style.getImage() as CircleStyle;
    expect(image.getFill()?.getColor()).toBe(INVISIBLE_POINT_FILL_COLOR);
  });

  it("text matches createTextStyle output", () => {
    const style = createTextFeatureStyle("My Label");
    const expected = createTextStyle("My Label");

    expect(style.getText()?.getText()).toBe(expected.getText());
    expect(style.getText()?.getFont()).toBe(expected.getFont());
    expect(style.getText()?.getFill()?.getColor()).toBe(
      expected.getFill()?.getColor(),
    );
    expect(style.getText()?.getStroke()?.getColor()).toBe(
      expected.getStroke()?.getColor(),
    );
    expect(style.getText()?.getStroke()?.getWidth()).toBe(
      expected.getStroke()?.getWidth(),
    );
  });

  it("handles empty string", () => {
    const style = createTextFeatureStyle("");
    expect(style.getText()?.getText()).toBe("");
  });
});
