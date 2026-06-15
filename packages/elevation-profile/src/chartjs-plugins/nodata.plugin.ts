import type { Chart, Plugin } from "chart.js";

import type { ElevationProfilePoint } from "@/types";

export interface NoDataPluginOptions {
  points: ElevationProfilePoint[];
  noDataText?: string;
}

const noDataPlugin: Plugin = {
  id: "noData",
  afterDraw(chart: Chart, _args, pluginOptions: NoDataPluginOptions) {
    const { points, noDataText = "No data" } = pluginOptions;
    if (!points?.length) {
      return;
    }

    const {
      ctx,
      chartArea,
      scales: { x },
    } = chart;
    const { top, height } = chartArea ?? {};
    const { right, left } = x ?? {};

    if (!x || !x.getPixelForValue || !left || !right) {
      return;
    }

    let segmentStart: ElevationProfilePoint | null = null;

    const drawRect = (
      start: ElevationProfilePoint,
      end: ElevationProfilePoint,
    ) => {
      const xStart = Math.max(x.getPixelForValue(start.dist), left);
      const xStop = Math.min(x.getPixelForValue(end.dist), right);
      if (
        (xStart === left && xStop < left) ||
        (xStop === right && xStart > right)
      ) {
        return;
      }

      ctx.save();
      const rectWidth = xStop - xStart;
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(xStart, top, rectWidth, height);

      const fontSize = 11;
      ctx.font = `normal 700 ${fontSize}px Unknown, sans-serif`;
      if (rectWidth >= ctx.measureText(noDataText).width + 5) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.textAlign = "center";
        const textPosition = {
          x: xStart + rectWidth / 2.0,
          y: top + height / 2.0 + fontSize / 2.0,
        };
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.strokeText(noDataText, textPosition.x, textPosition.y);
        ctx.fillText(noDataText, textPosition.x, textPosition.y);
      }
      ctx.restore();
    };

    for (let i = 0; i < points.length; i++) {
      const point = points[i]!;
      if (!point.hasElevationData && !segmentStart) {
        segmentStart = points[i - 1] ?? point;
      } else if (point.hasElevationData && segmentStart) {
        drawRect(segmentStart, point);
        segmentStart = null;
      }
    }

    if (segmentStart) {
      drawRect(segmentStart, points[points.length - 1]!);
    }
  },
};

export default noDataPlugin;
