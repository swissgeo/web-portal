import { describe, it, expect } from "vitest";

import { DEFAULT_MARKER_ICON, getMarkerIconById, MARKER_ICONS } from "../index";

describe("drawing package", () => {
  it("exports marker icon helpers from the package entrypoint", () => {
    expect(MARKER_ICONS.length).toBeGreaterThan(0);
    expect(DEFAULT_MARKER_ICON).toBe(MARKER_ICONS[0]);
    expect(getMarkerIconById(DEFAULT_MARKER_ICON.id)).toBe(DEFAULT_MARKER_ICON);
  });
});
