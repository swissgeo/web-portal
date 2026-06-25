import type { Geometry } from "ol/geom";

import Feature from "ol/Feature";
import { Point } from "ol/geom";
import { describe, expect, it } from "vitest";

import {
  DESCRIPTION_KEY,
  getFeatureDescription,
  getFeatureTitle,
  initializeMetadataProperties,
  setFeatureDescription,
  setFeatureTitle,
  TITLE_KEY,
} from "@/utils/drawingMetadata";

function makeFeature() {
  return new Feature<Geometry>(new Point([0, 0]));
}

function getFeatureNumber(title: string) {
  return Number(title.replace("Feature ", ""));
}

describe("drawing metadata properties", () => {
  it("initializes default title and description properties", () => {
    const firstFeature = makeFeature();
    const secondFeature = makeFeature();

    initializeMetadataProperties(firstFeature);
    initializeMetadataProperties(secondFeature);

    const firstTitle = getFeatureTitle(firstFeature);
    const secondTitle = getFeatureTitle(secondFeature);

    expect(firstTitle).toMatch(/^Feature \d+$/);
    expect(getFeatureNumber(secondTitle)).toBe(
      getFeatureNumber(firstTitle) + 1,
    );
    expect(firstFeature.get(DESCRIPTION_KEY)).toBe("");
    expect(getFeatureDescription(secondFeature)).toBe("");
  });

  it("sets and reads title and description values", () => {
    const feature = makeFeature();

    setFeatureTitle(feature, "Survey point");
    setFeatureDescription(feature, "Created during a field check");

    expect(feature.get(TITLE_KEY)).toBe("Survey point");
    expect(getFeatureTitle(feature)).toBe("Survey point");
    expect(getFeatureDescription(feature)).toBe("Created during a field check");
  });

  it("falls back to empty strings when metadata is missing", () => {
    const feature = makeFeature();

    expect(getFeatureTitle(feature)).toBe("");
    expect(getFeatureDescription(feature)).toBe("");
  });

  it("ignores null features in metadata accessors", () => {
    const feature = null as unknown as Feature<Geometry>;

    expect(() => setFeatureTitle(feature, "Ignored")).not.toThrow();
    expect(() => setFeatureDescription(feature, "Ignored")).not.toThrow();
    expect(getFeatureTitle(feature)).toBe("");
    expect(getFeatureDescription(feature)).toBe("");
  });
});
