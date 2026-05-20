import type { Geometry } from "ol/geom";

import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { describe, expect, it } from "vitest";

import { resolveFeatureId } from "../utils/drawingUtils";

describe("drawingUtils.resolveFeatureId", () => {
  it("returns existing string id when present", () => {
    const feature = new Feature(new Point([0, 0])) as Feature<Geometry>;
    feature.setId("feature-123");

    expect(resolveFeatureId(feature)).toBe("feature-123");
  });

  it("creates and stores runtime id when id is missing", () => {
    const feature = new Feature(new Point([0, 0])) as Feature<Geometry>;

    const featureId = resolveFeatureId(feature);

    expect(featureId.length).toBeGreaterThan(0);
    expect(feature.get("__drawingFeatureId")).toBe(featureId);
  });

  it("reuses existing __drawingFeatureId when already set", () => {
    const feature = new Feature(new Point([0, 0])) as Feature<Geometry>;
    feature.set("__drawingFeatureId", "runtime-abc", true);

    expect(resolveFeatureId(feature)).toBe("runtime-abc");
  });
});
