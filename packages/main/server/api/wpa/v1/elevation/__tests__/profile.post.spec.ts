import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import profileFixture from "./fixtures/profile.json";

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

describe("elevation profile request handling", () => {
  it("formats upstream data as profile points and metadata", async () => {
    const coordinates = [
      [2_704_280.989, 1_170_235.988],
      [2_704_285.137, 1_170_234.128],
    ];
    readBodyMock.mockResolvedValue({
      geojson: { type: "LineString", coordinates },
      sr: 2056,
    });
    fetchMock.mockResolvedValue(profileFixture);

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
        coordinate: [2_704_280.989, 1_170_235.988],
        elevation: 1341.7,
        hasElevationData: true,
      },
      {
        dist: 2.5,
        coordinate: [2_704_283.24, 1_170_234.979],
        elevation: 1341.8,
        hasElevationData: true,
      },
      {
        dist: 3,
        coordinate: [2_704_283.769, 1_170_234.741],
        elevation: 1341.8,
        hasElevationData: true,
      },
      {
        dist: 4.5,
        coordinate: [2_704_285.137, 1_170_234.128],
        elevation: 1341.7,
        hasElevationData: true,
      },
    ]);
    expect(result.metadata).toMatchObject({
      totalLinearDist: 4.5,
      minElevation: 1341.7,
      maxElevation: 1341.8,
      elevationDifference: 0,
      hasElevationData: true,
      hasDistanceData: true,
      dataModel: "swissALTI3D/COMB",
    });
    expect(result.metadata.totalAscent).toBeCloseTo(0.1, 6);
    expect(result.metadata.totalDescent).toBeCloseTo(0.1, 6);
    expect(result.metadata.slopeDistance).toBeCloseTo(4.505329, 6);
  });
});
