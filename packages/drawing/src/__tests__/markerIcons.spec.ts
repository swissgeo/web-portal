import { describe, expect, it } from "vitest";

import {
  DEFAULT_MARKER_ICON,
  getIconFilename,
  getMarkerIconById,
  MARKER_ICONS,
  dataUrlToUint8Array,
} from "@/utils/markerIcons";

describe("marker icons", () => {
  it("uses the first marker as the default icon", () => {
    expect(DEFAULT_MARKER_ICON).toBe(MARKER_ICONS[0]);
    expect(DEFAULT_MARKER_ICON.id).toBe("red-pin");
  });

  it("finds marker icons by id", () => {
    expect(getMarkerIconById("blue-pin")?.name).toBe("Blue Pin");
    expect(getMarkerIconById("missing-icon")).toBeUndefined();
  });

  it("defines embeddable SVG data URLs with dimensions and anchors", () => {
    expect(MARKER_ICONS).toHaveLength(6);

    for (const icon of MARKER_ICONS) {
      expect(icon.dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(icon.width).toBeGreaterThan(0);
      expect(icon.height).toBeGreaterThan(0);
      expect(icon.anchor).toHaveLength(2);
      expect(icon.anchor[0]).toBeGreaterThanOrEqual(0);
      expect(icon.anchor[0]).toBeLessThanOrEqual(1);
      expect(icon.anchor[1]).toBeGreaterThanOrEqual(0);
      expect(icon.anchor[1]).toBeLessThanOrEqual(1);
    }
  });

  it("builds deterministic icon filenames for KMZ embedding", () => {
    expect(getIconFilename("red-pin")).toBe("icons/red-pin.svg");
  });

  it("converts data URLs into bytes", async () => {
    const bytes = await dataUrlToUint8Array("data:text/plain;base64,SGVsbG8=");

    expect([...bytes]).toEqual([72, 101, 108, 108, 111]);
  });
});
