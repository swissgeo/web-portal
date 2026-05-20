import type { ElevationProfileResponse } from "@/types";

export const makeProfile = (
  overrides: Partial<ElevationProfileResponse> = {},
): ElevationProfileResponse => ({
  points: [
    {
      dist: 0,
      coordinate: [2600000, 1200000],
      elevation: 400,
      hasElevationData: true,
    },
    {
      dist: 500,
      coordinate: [2600500, 1200000],
      elevation: 450,
      hasElevationData: true,
    },
    {
      dist: 1000,
      coordinate: [2601000, 1200000],
      elevation: 500,
      hasElevationData: true,
    },
  ],
  metadata: {
    totalLinearDist: 1000,
    minElevation: 400,
    maxElevation: 500,
    elevationDifference: 100,
    totalAscent: 100,
    totalDescent: 0,
    slopeDistance: 1005,
    hasElevationData: true,
    hasDistanceData: true,
  },
  ...overrides,
});
