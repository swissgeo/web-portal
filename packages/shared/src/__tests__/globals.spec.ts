import { describe, expect, it } from "vitest";

import {
  ALLOWED_LANGUAGES,
  DRAWING_LAYER_ID,
  EPSG_2056_BOUNDING_BOX,
  EPSG_2056_CH1903,
  EPSG_4326_WGS84,
} from "../globals";

describe("GLOBALS", () => {
  it("ALLOWED_LANGUAGES lists de, fr, en, it, rm", () => {
    expect(ALLOWED_LANGUAGES).toEqual(["de", "fr", "en", "it", "rm"]);
  });

  it("DRAWING_LAYER_ID is user-drawing-layer", () => {
    expect(DRAWING_LAYER_ID).toBe("user-drawing-layer");
  });

  it("EPSG_4326_WGS84 is EPSG:4326", () => {
    expect(EPSG_4326_WGS84).toBe("EPSG:4326");
  });

  it("EPSG_2056_CH1903 is EPSG:2056", () => {
    expect(EPSG_2056_CH1903).toBe("EPSG:2056");
  });

  it("EPSG_2056_BOUNDING_BOX has correct bounds", () => {
    expect(EPSG_2056_BOUNDING_BOX).toEqual([
      2420000, 1030000, 2900000, 1350000,
    ]);
  });
});
