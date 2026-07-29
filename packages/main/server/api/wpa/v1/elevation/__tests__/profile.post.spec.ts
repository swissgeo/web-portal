import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const readBodyMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("readBody", readBodyMock);
mockNuxtImport("useRuntimeConfig", () => () => ({
  geoadminApiBaseUrl: "https://api.example.test",
}));
vi.stubGlobal("$fetch", fetchMock);

const handlerPromise = import("../profile.post").then(
  ({ default: handler }) => handler,
);

beforeEach(() => {
  readBodyMock.mockReset();
  fetchMock.mockReset();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/wpa/v1/elevation/profile", () => {
  it("returns the elevation profile and its metadata", async () => {
    const coordinates = [
      [2_600_000, 1_200_000],
      [2_600_100, 1_200_000],
      [2_600_220, 1_200_000],
    ];
    readBodyMock.mockResolvedValue({
      geojson: { type: "LineString", coordinates },
      sr: 2056,
    });
    fetchMock.mockResolvedValue([
      {
        alts: { COMB: 500 },
        dist: 0,
        easting: 2_600_000,
        northing: 1_200_000,
      },
      {
        alts: { COMB: 520 },
        dist: 100,
        easting: 2_600_100,
        northing: 1_200_000,
      },
      {
        alts: { COMB: 510 },
        dist: 220,
        easting: 2_600_220,
        northing: 1_200_000,
      },
    ]);

    const handler = await handlerPromise;
    const result = await handler({} as Parameters<typeof handler>[0]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/profile.json",
      {
        method: "POST",
        query: { offset: 0, sr: 2056, distinct_points: true },
        body: { type: "LineString", coordinates },
      },
    );
    expect(result.points).toEqual([
      {
        dist: 0,
        coordinate: [2_600_000, 1_200_000],
        elevation: 500,
        hasElevationData: true,
      },
      {
        dist: 100,
        coordinate: [2_600_100, 1_200_000],
        elevation: 520,
        hasElevationData: true,
      },
      {
        dist: 220,
        coordinate: [2_600_220, 1_200_000],
        elevation: 510,
        hasElevationData: true,
      },
    ]);
    expect(result.metadata).toMatchObject({
      totalLinearDist: 220,
      minElevation: 500,
      maxElevation: 520,
      elevationDifference: 10,
      totalAscent: 20,
      totalDescent: 10,
      hasElevationData: true,
      hasDistanceData: true,
      dataModel: "swissALTI3D/COMB",
    });
    expect(result.metadata.slopeDistance).toBeCloseTo(222.396336, 6);
  });
});
