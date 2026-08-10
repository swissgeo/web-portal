import { describe, expect, it } from "vitest";

import { WEBMERCATOR } from "@/proj";

describe("WebMercatorCoordinateSystem", () => {
  describe("getResolutionForZoom", () => {
    it.each([
      { zoom: 0, expected: 156368.08 },
      { zoom: 8.5, expected: 431.91 },
      { zoom: 18, expected: 0.6 },
    ])(
      "returns correct resolution value for valid zooms at equator (zoom=$zoom)",
      ({ zoom, expected }) => {
        const resolution = WEBMERCATOR.getResolutionForZoom(zoom, [0, 0]);
        expect(resolution).toBe(expected);
      },
    );

    it.each([
      { zoom: 0, expected: 78184.04 },
      { zoom: 8.5, expected: 215.95 },
      { zoom: 18, expected: 0.3 },
    ])(
      "returns correct resolution value for valid zooms at latitude 60° (zoom=$zoom)",
      ({ zoom, expected }) => {
        const LAT_60_DEG_IN_WEBMERCATOR = 8399737.88981836;
        const resolution = WEBMERCATOR.getResolutionForZoom(zoom, [
          0,
          LAT_60_DEG_IN_WEBMERCATOR,
        ]);
        expect(resolution).toBe(expected);
      },
    );
  });
});
