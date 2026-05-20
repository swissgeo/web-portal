import { describe, expect, it } from "vitest";
import { ref } from "vue";

import type { ElevationProfileResponse } from "@/types";
import { useElevationProfileChart } from "@/composables/useElevationProfileChart";

const makeProfile = (
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

function setupComposable(profile: ElevationProfileResponse) {
  return useElevationProfileChart(
    profile,
    ref(null),
    ref(null),
    ref(null),
    { xAxis: "Distance", yAxis: "Altitude", noData: "No data" },
  );
}

describe("unitUsedOnDistanceAxis", () => {
  it("uses meters when total distance is below 10000", () => {
    const { unitUsedOnDistanceAxis } = setupComposable(makeProfile());
    expect(unitUsedOnDistanceAxis.value).toBe("m");
  });

  it("uses km when total distance is exactly 10000", () => {
    const { unitUsedOnDistanceAxis } = setupComposable(
      makeProfile({ metadata: { ...makeProfile().metadata, totalLinearDist: 10000 } }),
    );
    expect(unitUsedOnDistanceAxis.value).toBe("km");
  });

  it("uses km when total distance exceeds 10000", () => {
    const { unitUsedOnDistanceAxis } = setupComposable(
      makeProfile({ metadata: { ...makeProfile().metadata, totalLinearDist: 25000 } }),
    );
    expect(unitUsedOnDistanceAxis.value).toBe("km");
  });
});

describe("chartJsData", () => {
  it("maps each point to a chart point with x and y", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const data = chartJsData.value.datasets[0].data as Array<{ x: number; y: number | null }>;
    expect(data).toHaveLength(3);
    expect(data[0].x).toBe(0);
    expect(data[0].y).toBe(400);
    expect(data[1].x).toBe(500);
    expect(data[1].y).toBe(450);
    expect(data[2].x).toBe(1000);
    expect(data[2].y).toBe(500);
  });

  it("sets y to null when elevation is undefined", () => {
    const profile = makeProfile({
      points: [
        { dist: 0, coordinate: [2600000, 1200000], elevation: undefined, hasElevationData: false },
      ],
    });
    const { chartJsData } = setupComposable(profile);
    const data = chartJsData.value.datasets[0].data as Array<{ x: number; y: number | null }>;
    expect(data[0].y).toBeNull();
  });

  it("preserves the original point fields alongside x and y", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const point = chartJsData.value.datasets[0].data[0] as Record<string, unknown>;
    expect(point.coordinate).toEqual([2600000, 1200000]);
    expect(point.hasElevationData).toBe(true);
  });
});

describe("y-axis bounds (via chartJsOptions)", () => {
  it("sets y min below minElevation by at least 5", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const yMin = (chartJsOptions.value?.scales as Record<string, { min?: number }>)?.y?.min;
    expect(yMin).toBeLessThan(400);
    expect(yMin).toBeGreaterThanOrEqual(0);
  });

  it("sets y max above maxElevation by at least 5", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const yMax = (chartJsOptions.value?.scales as Record<string, { max?: number }>)?.y?.max;
    expect(yMax).toBeGreaterThan(500);
  });

  it("clamps y min to 0 when calculation would go negative", () => {
    const profile = makeProfile({
      metadata: {
        ...makeProfile().metadata,
        minElevation: 2,
        maxElevation: 4,
      },
    });
    const { chartJsOptions } = setupComposable(profile);
    const yMin = (chartJsOptions.value?.scales as Record<string, { min?: number }>)?.y?.min;
    expect(yMin).toBe(0);
  });

  it("applies 10% of elevation delta as padding, minimum 5", () => {
    const profile = makeProfile({
      metadata: {
        ...makeProfile().metadata,
        minElevation: 0,
        maxElevation: 1000,
      },
    });
    const { chartJsOptions } = setupComposable(profile);
    const scales = chartJsOptions.value?.scales as Record<string, { min?: number; max?: number }>;
    expect(scales?.y?.min).toBe(0);
    expect(scales?.y?.max).toBeGreaterThanOrEqual(1100);
  });
});

describe("noData plugin options", () => {
  it("passes points to the noData plugin", () => {
    const profile = makeProfile();
    const { chartJsOptions } = setupComposable(profile);
    const noData = (chartJsOptions.value?.plugins as Record<string, unknown>)?.noData as { points: unknown[] };
    expect(noData?.points).toHaveLength(profile.points.length);
  });

  it("passes the noData label from labels", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const noData = (chartJsOptions.value?.plugins as Record<string, unknown>)?.noData as { noDataText: string };
    expect(noData?.noDataText).toBe("No data");
  });
});

describe("tooltipStyle", () => {
  it("is hidden when no point is hovered", () => {
    const { tooltipStyle } = setupComposable(makeProfile());
    expect(tooltipStyle.value.visibility).toBe("hidden");
  });
});
