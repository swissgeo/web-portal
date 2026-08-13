import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";

import type { ElevationProfileResponse } from "@/types";

vi.mock("chartjs-plugin-zoom", () => ({
  resetZoom: vi.fn(),
}));

import { resetZoom } from "chartjs-plugin-zoom";

import { defaultLabels, makeProfile } from "@/__tests__/fixtures";
import { useElevationProfileChart } from "@/composables/useElevationProfileChart";

type ExternalTooltipFn = (_model: {
  chart: { canvas: { getBoundingClientRect: () => DOMRect } };
  tooltip: {
    dataPoints?: Array<{
      raw: unknown;
      element: { x: number; y: number };
    }>;
  };
}) => void;

function setupComposable(profile: ElevationProfileResponse) {
  return useElevationProfileChart(
    profile,
    ref(null),
    ref(null),
    ref(null),
    defaultLabels,
  );
}

function makeTooltipRef(opacity: string) {
  const el = document.createElement("div");
  Object.defineProperty(el.style, "opacity", { value: opacity });
  return ref<HTMLDivElement | null>(el);
}

function makeChartRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    left: 0,
    right: 400,
    top: 0,
    bottom: 300,
    width: 400,
    height: 300,
    x: 0,
    y: 0,
    toJSON: () => {},
    ...overrides,
  };
}

function makeExternalCallback(
  profile: ElevationProfileResponse,
  tooltipRef?: ReturnType<typeof ref<HTMLDivElement | null>>,
) {
  const { chartJsOptions, ...rest } = useElevationProfileChart(
    profile,
    ref(null),
    ref(null),
    tooltipRef ?? ref(null),
    defaultLabels,
  );
  const tooltip = (chartJsOptions.value?.plugins as Record<string, unknown>)
    ?.tooltip as { external: ExternalTooltipFn };
  return { externalCallback: tooltip.external, ...rest };
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
    expect(getYScale(makeProfile()).y?.min).toBe(390);
  });

  it("sets y max to ceil(maxElevation) plus 10% delta padding", () => {
    expect(getYScale(makeProfile()).y?.max).toBe(510);
  });

  it("uses minimum padding of 5 when 10% delta is smaller", () => {
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
    const profile = makeProfile({
      metadata: { ...makeProfile().metadata, minElevation: 2, maxElevation: 4 },
    });
    expect(getYScale(profile).y?.min).toBe(0);
  });

  it("applies 10% of elevation delta as padding for large ranges", () => {
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

describe("tooltipStyle clamping", () => {
  it("clamps tooltip to right edge when it would overflow", () => {
    const tooltipEl = document.createElement("div");
    Object.defineProperty(tooltipEl, "clientWidth", { value: 200 });
    const tooltipRef = ref<HTMLDivElement | null>(tooltipEl);

    const chartEl = document.createElement("div");
    vi.spyOn(chartEl, "getBoundingClientRect").mockReturnValue(
      makeChartRect({ right: 400 }),
    );
    const chartContainerRef = ref<HTMLDivElement | null>(chartEl);

    const { tooltipStyle, pointBeingHovered } = useElevationProfileChart(
      makeProfile(),
      ref(null),
      chartContainerRef,
      tooltipRef,
      defaultLabels,
    );

    pointBeingHovered.value = {
      dist: 500,
      elevation: 450,
      coordinate: [2600500, 1200000],
      screenPosition: [350, 150],
      hasElevationData: true,
    };

    const left = Number.parseInt(tooltipStyle.value.left ?? "0", 10);
    expect(left).toBeLessThanOrEqual(400 - 200);
  });

  it("clamps tooltip to left edge when it would overflow", () => {
    const tooltipEl = document.createElement("div");
    Object.defineProperty(tooltipEl, "clientWidth", { value: 200 });
    const tooltipRef = ref<HTMLDivElement | null>(tooltipEl);

    const chartEl = document.createElement("div");
    vi.spyOn(chartEl, "getBoundingClientRect").mockReturnValue(
      makeChartRect({ left: 100, right: 500, x: 100 }),
    );
    const chartContainerRef = ref<HTMLDivElement | null>(chartEl);

    const { tooltipStyle, pointBeingHovered } = useElevationProfileChart(
      makeProfile(),
      ref(null),
      chartContainerRef,
      tooltipRef,
      defaultLabels,
    );

    pointBeingHovered.value = {
      dist: 500,
      elevation: 450,
      coordinate: [2600500, 1200000],
      screenPosition: [50, 150],
      hasElevationData: true,
    };

    const left = Number.parseInt(tooltipStyle.value.left ?? "0", 10);
    expect(left).toBeGreaterThanOrEqual(155);
  });
});

describe("chartJsTooltipConfiguration", () => {
  it("returns early when tooltip.dataPoints is undefined", () => {
    const { externalCallback } = makeExternalCallback(makeProfile());

    expect(() =>
      externalCallback({
        chart: {
          canvas: {
            getBoundingClientRect: () => makeChartRect(),
          },
        },
        tooltip: { dataPoints: undefined },
      }),
    ).not.toThrow();
  });

  it("returns early when tooltipElement is null", () => {
    const { externalCallback } = makeExternalCallback(makeProfile());

    expect(() =>
      externalCallback({
        chart: {
          canvas: {
            getBoundingClientRect: () => makeChartRect(),
          },
        },
        tooltip: { dataPoints: [{ raw: {}, element: { x: 0, y: 0 } }] },
      }),
    ).not.toThrow();
  });

  it("calls clearHoverPosition when tooltip element opacity is 0", () => {
    const tooltipRef = makeTooltipRef("0");
    const { externalCallback, pointBeingHovered } = makeExternalCallback(
      makeProfile(),
      tooltipRef,
    );

    pointBeingHovered.value = {
      dist: 100,
      elevation: 400,
      coordinate: [2600100, 1200000],
      screenPosition: [50, 50],
      hasElevationData: true,
    };

    externalCallback({
      chart: {
        canvas: {
          getBoundingClientRect: () => makeChartRect(),
        },
      },
      tooltip: { dataPoints: [{ raw: {}, element: { x: 0, y: 0 } }] },
    });

    expect(pointBeingHovered.value).toBeUndefined();
  });

  it("sets pointBeingHovered when tracking is enabled and dataPoints exist", () => {
    const tooltipRef = makeTooltipRef("1");
    const { externalCallback, pointBeingHovered, startPositionTracking } =
      makeExternalCallback(makeProfile(), tooltipRef);

    startPositionTracking();

    externalCallback({
      chart: {
        canvas: {
          getBoundingClientRect: () => makeChartRect({ left: 100, top: 50 }),
        },
      },
      tooltip: {
        dataPoints: [
          {
            raw: {
              dist: 300,
              elevation: 450,
              coordinate: [2600300, 1200000],
              hasElevationData: true,
            },
            element: { x: 200, y: 100 },
          },
        ],
      },
    });

    expect(pointBeingHovered.value).toBeDefined();
    expect(pointBeingHovered.value?.elevation).toBe(450);
    expect(pointBeingHovered.value?.dist).toBe(300);
    expect(pointBeingHovered.value?.coordinate).toEqual([2600300, 1200000]);
  });

  it("calls clearHoverPosition when tracking is disabled", () => {
    const tooltipRef = makeTooltipRef("1");
    const { externalCallback, pointBeingHovered } = makeExternalCallback(
      makeProfile(),
      tooltipRef,
    );

    pointBeingHovered.value = {
      dist: 100,
      elevation: 400,
      coordinate: [2600100, 1200000],
      screenPosition: [50, 50],
      hasElevationData: true,
    };

    externalCallback({
      chart: {
        canvas: {
          getBoundingClientRect: () => makeChartRect(),
        },
      },
      tooltip: {
        dataPoints: [
          {
            raw: {
              dist: 300,
              elevation: 450,
              coordinate: [2600300, 1200000],
              hasElevationData: true,
            },
            element: { x: 200, y: 100 },
          },
        ],
      },
    });

    expect(pointBeingHovered.value).toBeUndefined();
  });
});

describe("chartJsZoomOptions early return", () => {
  it("returns undefined when metadata is missing", () => {
    const { chartJsOptions } = setupComposable(
      makeProfile({
        metadata: undefined as unknown as ElevationProfileResponse["metadata"],
      }),
    );
    const zoom = (chartJsOptions.value?.plugins as Record<string, unknown>)
      ?.zoom;
    expect(zoom).toBeUndefined();
  });
});

describe("resetZoomToBaseValue with valid chart", () => {
  it("calls resetZoom on the chart when chartRef has a chart", () => {
    const chartMock = { reset: vi.fn() };
    const chartRef = ref({ chart: chartMock });
    const { resetZoomToBaseValue } = useElevationProfileChart(
      makeProfile(),
      chartRef as never,
      ref(null),
      ref(null),
      defaultLabels,
    );
    resetZoomToBaseValue();
    expect(resetZoom).toHaveBeenCalledWith(chartMock, "none");
  });
});

describe("lifecycle hooks", () => {
  it("registers and cleans up window event listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const Wrapper = defineComponent({
      setup() {
        useElevationProfileChart(
          makeProfile(),
          ref(null),
          ref(null),
          ref(null),
          defaultLabels,
        );
        return () => h("div");
      },
    });

    const wrapper = mount(Wrapper);
    expect(addSpy).toHaveBeenCalledWith("beforeprint", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("afterprint", expect.any(Function));

    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith("beforeprint", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("afterprint", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("creates ResizeObserver when container ref is available", () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    class MockResizeObserver {
      observe = observeSpy;
      disconnect = disconnectSpy;
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const containerEl = document.createElement("div");
    const containerRef = ref<HTMLDivElement | null>(containerEl);

    const Wrapper = defineComponent({
      setup() {
        useElevationProfileChart(
          makeProfile(),
          ref(null),
          containerRef,
          ref(null),
          defaultLabels,
        );
        return () => h("div");
      },
    });

    const wrapper = mount(Wrapper);
    expect(observeSpy).toHaveBeenCalledWith(containerEl);

    wrapper.unmount();
    expect(disconnectSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
