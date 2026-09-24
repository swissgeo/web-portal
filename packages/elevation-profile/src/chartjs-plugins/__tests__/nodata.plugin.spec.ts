import { describe, expect, it } from "vitest";

import type { MockCtx } from "@/__tests__/mocks";
import type { ElevationProfilePoint } from "@/types";

import { makeCtx } from "@/__tests__/mocks";
import noDataPlugin from "@/chartjs-plugins/nodata.plugin";

function makeScale(getPixelForValue: (_v: number) => number) {
  return {
    getPixelForValue,
    left: 5,
    right: 400,
  };
}

function makeChart(scaleOverrides: { left?: number; right?: number } = {}) {
  const ctx = makeCtx();
  const scale = makeScale((v) => v / 10);
  Object.assign(scale, scaleOverrides);
  return {
    ctx,
    chartArea: { top: 10, height: 280 },
    scales: { x: scale },
  } as unknown as Parameters<NonNullable<typeof noDataPlugin.afterDraw>>[0];
}

function point(dist: number, hasElevationData: boolean): ElevationProfilePoint {
  return {
    dist,
    coordinate: [2600000 + dist, 1200000],
    elevation: hasElevationData ? 400 + dist / 10 : undefined,
    hasElevationData,
  };
}

describe("noDataPlugin", () => {
  it("has id 'noData'", () => {
    expect(noDataPlugin.id).toBe("noData");
  });

  it("returns early when points is empty", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [],
      noDataText: "No data",
    });
    expect(chart.ctx.fillRect).not.toHaveBeenCalled();
  });

  it("returns early when points is undefined", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: undefined as unknown as ElevationProfilePoint[],
    });
    expect(chart.ctx.fillRect).not.toHaveBeenCalled();
  });

  it("does not draw when all points have elevation data", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, true), point(100, true), point(200, true)],
      noDataText: "No data",
    });
    expect(chart.ctx.fillRect).not.toHaveBeenCalled();
  });

  it("draws a rectangle for a contiguous no-data segment", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [
        point(0, true),
        point(100, false),
        point(200, false),
        point(300, true),
      ],
      noDataText: "No data",
    });
    expect(chart.ctx.fillRect).toHaveBeenCalledOnce();
  });

  it("draws rectangles for multiple disjoint no-data segments", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [
        point(0, true),
        point(50, false),
        point(100, true),
        point(150, false),
        point(200, true),
      ],
      noDataText: "No data",
    });
    expect(chart.ctx.fillRect).toHaveBeenCalledTimes(2);
  });

  it("handles gap starting at the first point", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(100, true)],
      noDataText: "No data",
    });
    expect(chart.ctx.fillRect).toHaveBeenCalledOnce();
  });

  it("handles gap extending to the last point", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, true), point(100, false), point(200, false)],
      noDataText: "No data",
    });
    expect(chart.ctx.fillRect).toHaveBeenCalledOnce();
  });

  it("draws no-data text label when rectangle is wide enough", () => {
    const chart = makeChart();
    const ctx = chart.ctx;
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(1000, true)],
      noDataText: "No data",
    });
    expect(ctx.fillText).toHaveBeenCalledOnce();
    expect(ctx.strokeText).toHaveBeenCalledOnce();
  });

  it("does not draw text label when rectangle is too narrow", () => {
    const chart = makeChart();
    const ctx = chart.ctx as unknown as MockCtx;
    ctx.measureText.mockReturnValue({ width: 200 });
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(10, true)],
      noDataText: "No data with a very long label",
    });
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.strokeText).not.toHaveBeenCalled();
  });

  it("uses default 'No data' text when noDataText is not provided", () => {
    const chart = makeChart();
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(100, true)],
    });
    expect(chart.ctx.fillRect).toHaveBeenCalled();
  });

  it("returns early when x scale is missing", () => {
    const chart = {
      ctx: makeCtx(),
      chartArea: { top: 10, height: 280 },
      scales: { x: undefined },
    } as unknown as Parameters<NonNullable<typeof noDataPlugin.afterDraw>>[0];
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(100, true)],
    });
    expect(chart.ctx.fillRect).not.toHaveBeenCalled();
  });

  it("returns early when x scale has no getPixelForValue", () => {
    const chart = {
      ctx: makeCtx(),
      chartArea: { top: 10, height: 280 },
      scales: { x: { left: 0, right: 400 } },
    } as unknown as Parameters<NonNullable<typeof noDataPlugin.afterDraw>>[0];
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(100, true)],
    });
    expect(chart.ctx.fillRect).not.toHaveBeenCalled();
  });

  it("clamps rectangle xStart to left boundary", () => {
    const chart = makeChart({ left: 50 });
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(1000, true)],
      noDataText: "No data",
    });
    const ctx = chart.ctx as unknown as MockCtx;
    const fillRectCall = ctx.fillRect.mock.calls[0];
    expect(fillRectCall[0]).toBeGreaterThanOrEqual(50);
  });

  it("clamps rectangle xStop to right boundary", () => {
    const chart = makeChart({ right: 200 });
    noDataPlugin.afterDraw!(chart, undefined as never, {
      points: [point(0, false), point(5000, true)],
      noDataText: "No data",
    });
    const ctx = chart.ctx as unknown as MockCtx;
    const fillRectCall = ctx.fillRect.mock.calls[0];
    expect(fillRectCall[0] + fillRectCall[2]).toBeLessThanOrEqual(200);
  });
});
