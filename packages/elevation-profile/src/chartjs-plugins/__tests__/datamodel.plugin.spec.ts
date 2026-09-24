import { describe, expect, it } from "vitest";

import type { MockCtx } from "@/__tests__/mocks";

import { makeCtx } from "@/__tests__/mocks";
import dataModelPlugin from "@/chartjs-plugins/datamodel.plugin";

function makeChart(overrides: { chartArea?: Record<string, number> } = {}) {
  const ctx = makeCtx();
  return {
    ctx,
    chartArea: {
      top: 10,
      right: 400,
      width: 400,
      bottom: 300,
      left: 0,
      height: 290,
      ...overrides.chartArea,
    },
  } as unknown as Parameters<NonNullable<typeof dataModelPlugin.afterDraw>>[0];
}

describe("dataModelPlugin", () => {
  it("has id 'dataModel'", () => {
    expect(dataModelPlugin.id).toBe("dataModel");
  });

  it("draws the data model name when chart is wide enough", () => {
    const chart = makeChart();
    const ctx = chart.ctx;

    dataModelPlugin.afterDraw!(chart, undefined as never, {
      dataModelName: "swissALTI3D",
    });

    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();
    expect(ctx.strokeText).toHaveBeenCalledWith("swissALTI3D", 395, 25);
    expect(ctx.fillText).toHaveBeenCalledWith("swissALTI3D", 395, 25);
  });

  it("uses default name when dataModelName is not provided", () => {
    const chart = makeChart();
    const ctx = chart.ctx;

    dataModelPlugin.afterDraw!(chart, undefined as never, {});

    expect(ctx.fillText).toHaveBeenCalledWith("swissALTI3D/DHM25", 395, 25);
  });

  it("does not draw text when text width exceeds 1/3 of chart width", () => {
    const chart = makeChart({ chartArea: { width: 150, right: 150 } });
    const ctx = chart.ctx as unknown as MockCtx;
    ctx.measureText.mockReturnValue({ width: 60 });

    dataModelPlugin.afterDraw!(chart, undefined as never, {
      dataModelName: "A very long data model name",
    });

    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(ctx.strokeText).not.toHaveBeenCalled();
  });

  it("draws text when text width is exactly 1/3 of chart width", () => {
    const chart = makeChart({ chartArea: { width: 300, right: 300 } });
    const ctx = chart.ctx as unknown as MockCtx;
    ctx.measureText.mockReturnValue({ width: 100 });

    dataModelPlugin.afterDraw!(chart, undefined as never, {
      dataModelName: "exact",
    });

    expect(ctx.fillText).toHaveBeenCalledOnce();
  });

  it("handles missing chartArea by using default values", () => {
    const chart = {
      ctx: makeCtx(),
      chartArea: undefined,
    } as unknown as Parameters<
      NonNullable<typeof dataModelPlugin.afterDraw>
    >[0];

    expect(() => {
      dataModelPlugin.afterDraw!(chart, undefined as never, {
        dataModelName: "test",
      });
    }).not.toThrow();
  });

  it("sets correct font and text styling", () => {
    const chart = makeChart();
    const ctx = chart.ctx;

    dataModelPlugin.afterDraw!(chart, undefined as never, {
      dataModelName: "test",
    });

    expect(ctx.font).toBe("normal 700 12px Unknown, sans-serif");
    expect(ctx.textAlign).toBe("right");
    expect(ctx.fillStyle).toBe("#000");
    expect(ctx.strokeStyle).toBe("#fff");
    expect(ctx.lineWidth).toBe(1);
  });
});
