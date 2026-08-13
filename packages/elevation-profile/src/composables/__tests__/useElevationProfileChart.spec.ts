import { describe, expect, it } from "vitest";
import { ref } from "vue";

import type { ElevationProfileResponse } from "@/types";

import { defaultLabels, makeProfile } from "@/__tests__/fixtures";
import { useElevationProfileChart } from "@/composables/useElevationProfileChart";

function setupComposable(profile: ElevationProfileResponse) {
  return useElevationProfileChart(
    profile,
    ref(null),
    ref(null),
    ref(null),
    defaultLabels,
  );
}

describe("unitUsedOnDistanceAxis", () => {
  it("uses meters when total distance is below 10000", () => {
    const { unitUsedOnDistanceAxis } = setupComposable(makeProfile());
    expect(unitUsedOnDistanceAxis.value).toBe("m");
  });

  it("uses km when total distance is exactly 10000", () => {
    const { unitUsedOnDistanceAxis } = setupComposable(
      makeProfile({
        metadata: { ...makeProfile().metadata, totalLinearDist: 10000 },
      }),
    );
    expect(unitUsedOnDistanceAxis.value).toBe("km");
  });

  it("uses km when total distance exceeds 10000", () => {
    const { unitUsedOnDistanceAxis } = setupComposable(
      makeProfile({
        metadata: { ...makeProfile().metadata, totalLinearDist: 25000 },
      }),
    );
    expect(unitUsedOnDistanceAxis.value).toBe("km");
  });
});

describe("chartJsData", () => {
  it("maps each point to a chart point with x and y", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const data = chartJsData.value.datasets[0].data as Array<{
      x: number;
      y: number | null;
    }>;
    expect(data).toHaveLength(3);
    expect(data[0].x).toBe(0);
    expect(data[0].y).toBe(400);
    expect(data[1].x).toBe(300);
    expect(data[1].y).toBe(450);
    expect(data[2].x).toBe(1000);
    expect(data[2].y).toBe(500);
  });

  it("sets y to null when elevation is undefined", () => {
    const profile = makeProfile({
      points: [
        {
          dist: 0,
          coordinate: [2600000, 1200000],
          elevation: undefined,
          hasElevationData: false,
        },
      ],
    });
    const { chartJsData } = setupComposable(profile);
    const data = chartJsData.value.datasets[0].data as Array<{
      x: number;
      y: number | null;
    }>;
    expect(data[0].y).toBeNull();
  });

  it("falls back to x=0 when dist is undefined", () => {
    const profile = makeProfile({
      points: [
        {
          dist: undefined as unknown as number,
          coordinate: [2600000, 1200000],
          elevation: 400,
          hasElevationData: true,
        },
      ],
    });
    const { chartJsData } = setupComposable(profile);
    const data = chartJsData.value.datasets[0].data as Array<{ x: number }>;
    expect(data[0].x).toBe(0);
  });

  it("preserves the original point fields alongside x and y", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const point = chartJsData.value.datasets[0].data[0] as unknown as Record<
      string,
      unknown
    >;
    expect(point.coordinate).toEqual([2600000, 1200000]);
    expect(point.hasElevationData).toBe(true);
  });

  it("sets cubicInterpolationMode to monotone", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const dataset = chartJsData.value.datasets[0];
    expect(dataset.cubicInterpolationMode).toBe("monotone");
  });

  it("sets border and fill colors from config", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const dataset = chartJsData.value.datasets[0];
    expect(dataset.borderColor).toBe("rgb(255, 99, 132)");
    expect(dataset.borderWidth).toBe(1);
  });

  it("configures point radius and hover radius", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const dataset = chartJsData.value.datasets[0];
    expect(dataset.pointRadius).toBe(1);
    expect(dataset.pointHoverRadius).toBe(3);
  });
});

describe("y-axis bounds (via chartJsOptions)", () => {
  function getYScale(profile: ElevationProfileResponse) {
    const { chartJsOptions } = setupComposable(profile);
    return chartJsOptions.value?.scales as Record<
      string,
      { min?: number; max?: number }
    >;
  }

  it("sets y min to floor(minElevation) minus 10% delta padding", () => {
    // min=400, max=500, delta=100, 10%=10, padding=max(10,5)=10 → yMin=390
    expect(getYScale(makeProfile()).y?.min).toBe(390);
  });

  it("sets y max to ceil(maxElevation) plus 10% delta padding", () => {
    // min=400, max=500, delta=100, 10%=10, padding=max(10,5)=10 → yMax=510
    expect(getYScale(makeProfile()).y?.max).toBe(510);
  });

  it("uses minimum padding of 5 when 10% delta is smaller", () => {
    // min=400, max=402, delta=2, 10%=0 (rounded), padding=max(0,5)=5 → yMin=395, yMax=407
    const profile = makeProfile({
      metadata: {
        ...makeProfile().metadata,
        minElevation: 400,
        maxElevation: 402,
      },
    });
    const scales = getYScale(profile);
    expect(scales.y?.min).toBe(395);
    expect(scales.y?.max).toBe(407);
  });

  it("clamps y min to 0 when calculation would go negative", () => {
    // min=2, max=4, delta=2, 10%=0, padding=5 → yMin=max(2-5,0)=0
    const profile = makeProfile({
      metadata: { ...makeProfile().metadata, minElevation: 2, maxElevation: 4 },
    });
    expect(getYScale(profile).y?.min).toBe(0);
  });

  it("applies 10% of elevation delta as padding for large ranges", () => {
    // min=0, max=1000, delta=1000, 10%=100, padding=100 → yMin=0, yMax=1100
    const profile = makeProfile({
      metadata: {
        ...makeProfile().metadata,
        minElevation: 0,
        maxElevation: 1000,
      },
    });
    const scales = getYScale(profile);
    expect(scales.y?.min).toBe(0);
    expect(scales.y?.max).toBe(1100);
  });
});

describe("noData plugin options", () => {
  it("passes points to the noData plugin", () => {
    const profile = makeProfile();
    const { chartJsOptions } = setupComposable(profile);
    const noData = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.noData as { points: unknown[] };
    expect(noData?.points).toHaveLength(profile.points.length);
  });

  it("passes the noData label from labels", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const noData = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.noData as { noDataText: string };
    expect(noData?.noDataText).toBe("No data");
  });
});

describe("dataModel plugin options", () => {
  it("passes dataModelName from metadata to the dataModel plugin", () => {
    const profile = makeProfile({
      metadata: { ...makeProfile().metadata, dataModel: "swissALTI3D" },
    });
    const { chartJsOptions } = setupComposable(profile);
    const dataModel = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.dataModel as { dataModelName?: string };
    expect(dataModel?.dataModelName).toBe("swissALTI3D");
  });

  it("passes undefined dataModelName when metadata has no dataModel", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const dataModel = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.dataModel as { dataModelName?: string };
    expect(dataModel?.dataModelName).toBeUndefined();
  });
});

describe("x-axis label", () => {
  it("includes 'm' unit in x-axis title when distance is below 10000", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const xTitle = (
      chartJsOptions.value?.scales as Record<
        string,
        { title?: { text?: string } }
      >
    )?.x?.title?.text;
    expect(xTitle).toBe("Distance [m]");
  });

  it("includes 'km' unit in x-axis title when distance is >= 10000", () => {
    const profile = makeProfile({
      metadata: { ...makeProfile().metadata, totalLinearDist: 15000 },
    });
    const { chartJsOptions } = setupComposable(profile);
    const xTitle = (
      chartJsOptions.value?.scales as Record<
        string,
        { title?: { text?: string } }
      >
    )?.x?.title?.text;
    expect(xTitle).toBe("Distance [km]");
  });
});

describe("tooltipStyle", () => {
  it("is hidden when no point is hovered", () => {
    const { tooltipStyle } = setupComposable(makeProfile());
    expect(tooltipStyle.value.visibility).toBe("hidden");
  });

  it("is visible when pointBeingHovered is set", () => {
    const { tooltipStyle, pointBeingHovered } = setupComposable(makeProfile());
    pointBeingHovered.value = {
      dist: 500,
      elevation: 450,
      coordinate: [2600500, 1200000],
      screenPosition: [200, 150],
      hasElevationData: true,
    };
    expect(tooltipStyle.value.visibility).toBeUndefined();
    expect(tooltipStyle.value.left).toBeDefined();
    expect(tooltipStyle.value.top).toBeDefined();
  });

  it("positions tooltip above the hovered point", () => {
    const { tooltipStyle, pointBeingHovered } = setupComposable(makeProfile());
    pointBeingHovered.value = {
      dist: 500,
      elevation: 450,
      coordinate: [2600500, 1200000],
      screenPosition: [200, 150],
      hasElevationData: true,
    };
    const top = Number.parseInt(tooltipStyle.value.top ?? "0", 10);
    expect(top).toBeLessThan(150);
  });
});

describe("tracking functions", () => {
  it("startPositionTracking enables tracking", () => {
    const { startPositionTracking, pointBeingHovered } =
      setupComposable(makeProfile());
    startPositionTracking();
    expect(pointBeingHovered.value).toBeUndefined();
  });

  it("stopPositionTracking returns true", () => {
    const { stopPositionTracking } = setupComposable(makeProfile());
    const result = stopPositionTracking();
    expect(result).toBe(true);
  });

  it("clearHoverPosition resets pointBeingHovered to undefined", () => {
    const { clearHoverPosition, pointBeingHovered } =
      setupComposable(makeProfile());
    pointBeingHovered.value = {
      dist: 100,
      elevation: 400,
      coordinate: [2600100, 1200000],
      screenPosition: [50, 50],
      hasElevationData: true,
    };
    clearHoverPosition();
    expect(pointBeingHovered.value).toBeUndefined();
  });
});

describe("resetZoomToBaseValue", () => {
  it("does not throw when chartRef is null", () => {
    const { resetZoomToBaseValue } = setupComposable(makeProfile());
    expect(() => resetZoomToBaseValue()).not.toThrow();
  });
});

describe("chartJsOptions", () => {
  it("sets animation duration to 250", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    expect(chartJsOptions.value?.animation).toEqual({ duration: 250 });
  });

  it("sets responsive to true", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    expect(chartJsOptions.value?.responsive).toBe(true);
  });

  it("sets maintainAspectRatio to false", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    expect(chartJsOptions.value?.maintainAspectRatio).toBe(false);
  });

  it("sets resizeDelay to 100", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    expect(chartJsOptions.value?.resizeDelay).toBe(100);
  });

  it("disables legend", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    expect(chartJsOptions.value?.plugins?.legend).toEqual({ display: false });
  });

  it("sets interaction mode to index with no intersection", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    expect(chartJsOptions.value?.interaction).toEqual({
      mode: "index",
      intersect: false,
    });
  });

  it("returns undefined when profile metadata is missing", () => {
    const { chartJsOptions } = setupComposable(
      makeProfile({
        metadata: undefined as unknown as ElevationProfileResponse["metadata"],
      }),
    );
    expect(chartJsOptions.value).toBeUndefined();
  });
});

describe("zoom configuration", () => {
  it("sets x zoom limits from 0 to totalLinearDist", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as { limits: { x: { min: number; max: number } } };
    expect(zoom.limits.x.min).toBe(0);
    expect(zoom.limits.x.max).toBe(1000);
  });

  it("sets y zoom limits from 0 to maxElevation", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as { limits: { y: { min: number; max: number } } };
    expect(zoom.limits.y.min).toBe(0);
    expect(zoom.limits.y.max).toBe(500);
  });

  it("sets x minRange to 100 when using meters", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as { limits: { x: { minRange: number } } };
    expect(zoom.limits.x.minRange).toBe(100);
  });

  it("sets x minRange to 3000 when using km", () => {
    const profile = makeProfile({
      metadata: { ...makeProfile().metadata, totalLinearDist: 15000 },
    });
    const { chartJsOptions } = setupComposable(profile);
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as { limits: { x: { minRange: number } } };
    expect(zoom.limits.x.minRange).toBe(3000);
  });

  it("enables wheel and pinch zoom", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as {
      zoom: { wheel: { enabled: boolean }; pinch: { enabled: boolean } };
    };
    expect(zoom.zoom.wheel.enabled).toBe(true);
    expect(zoom.zoom.pinch.enabled).toBe(true);
  });

  it("enables drag zoom with shift modifier", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as {
      zoom: {
        drag: { enabled: boolean; modifierKey: string };
        mode: string;
      };
    };
    expect(zoom.zoom.drag.enabled).toBe(true);
    expect(zoom.zoom.drag.modifierKey).toBe("shift");
    expect(zoom.zoom.mode).toBe("x");
  });

  it("enables pan in x mode", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom as { pan: { enabled: boolean; mode: string } };
    expect(zoom.pan.enabled).toBe(true);
    expect(zoom.pan.mode).toBe("x");
  });
});

describe("x-axis tick callback", () => {
  it("applies factor of 1.0 when using meters", () => {
    const { chartJsOptions } = setupComposable(makeProfile());
    const xScale = (
      chartJsOptions.value?.scales as Record<
        string,
        { ticks?: { callback: (_val: number | string) => number | string } }
      >
    )?.x;
    const result = xScale?.ticks?.callback(500);
    expect(result).toBe(500);
  });

  it("applies factor of 0.001 when using km", () => {
    const profile = makeProfile({
      metadata: { ...makeProfile().metadata, totalLinearDist: 15000 },
    });
    const { chartJsOptions } = setupComposable(profile);
    const xScale = (
      chartJsOptions.value?.scales as Record<
        string,
        { ticks?: { callback: (_val: number | string) => number | string } }
      >
    )?.x;
    const result = xScale?.ticks?.callback(5000);
    expect(result).toBe(5);
  });
});

describe("line fill configuration", () => {
  it("fills above and below with FILL_COLOR targeting origin", () => {
    const { chartJsData } = setupComposable(makeProfile());
    const dataset = chartJsData.value.datasets[0];
    expect(dataset.fill).toEqual({
      target: "origin",
      above: "rgba(255, 99, 132, 0.7)",
      below: "rgba(255, 99, 132, 0.7)",
    });
  });
});
