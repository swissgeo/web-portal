import type {
  Chart,
  ChartData,
  ChartDataset,
  ChartOptions,
  ComplexFillTarget,
  LineOptions,
  Point as ChartPoint,
  PointPrefixedHoverOptions,
  PointPrefixedOptions,
  ScaleOptions,
  TooltipItem,
  TooltipModel,
} from "chart.js";
import type { ZoomPluginOptions } from "chartjs-plugin-zoom/types/options";
import type { MaybeRefOrGetter, ComputedRef, Ref } from "vue";

import { round } from "@swissgeo/numbers";
import { resetZoom } from "chartjs-plugin-zoom";
import { computed, onMounted, onUnmounted, ref, toValue } from "vue";

import type {
  ScreenPoint,
  Labels,
} from "@/components/ElevationProfilePlot.vue";
import type {
  ElevationProfileResponse,
  ElevationProfilePoint,
  ElevationProfileMetadata,
} from "@/types";

import { BORDER_COLOR, FILL_COLOR } from "@/config";

const GAP_BETWEEN_TOOLTIP_AND_PROFILE = 12;

type ElevationProfileChartPoint = ElevationProfilePoint & ChartPoint;

type TooltipStyleCSSDeclaration = {
  visibility?: "hidden" | "visible";
  left?: string;
  top?: string;
};

export function useElevationProfileChart(
  profile: MaybeRefOrGetter<ElevationProfileResponse>,
  chartRef: Ref<{ chart?: Chart } | null>,
  profileChartContainerRef: Ref<HTMLDivElement | null>,
  profileTooltipRef: Ref<HTMLDivElement | null>,
  labels: MaybeRefOrGetter<Labels>,
) {
  const track = ref<boolean>(false);
  const pointBeingHovered = ref<ScreenPoint>();

  const profileMetadata: ComputedRef<ElevationProfileMetadata> = computed(
    () => toValue(profile).metadata,
  );
  const profilePoints: ComputedRef<ElevationProfilePoint[]> = computed(
    () => toValue(profile).points,
  );
  const profileLabels: ComputedRef<Labels> = computed(() => toValue(labels));

  const maxElevation = computed(() => profileMetadata.value.maxElevation ?? 0);
  const minElevation = computed(() => profileMetadata.value.minElevation ?? 0);
  const totalLinearDist = computed(
    () => profileMetadata.value.totalLinearDist ?? 0,
  );

  const unitUsedOnDistanceAxis = computed(() =>
    totalLinearDist.value >= 10000 ? "km" : "m",
  );
  const factorToUseForDisplayedDistances = computed(() =>
    unitUsedOnDistanceAxis.value === "km" ? 0.001 : 1.0,
  );
  const tenPercentOfElevationDelta = computed(() =>
    round((maxElevation.value - minElevation.value) / 10.0),
  );
  const yAxisMinimumValue = computed(() =>
    Math.max(
      Math.floor(minElevation.value) -
        Math.max(Math.floor(tenPercentOfElevationDelta.value), 5),
      0,
    ),
  );
  const yAxisMaxValue = computed(
    () =>
      Math.ceil(maxElevation.value) +
      Math.max(Math.ceil(tenPercentOfElevationDelta.value), 5),
  );

  const tooltipStyle: ComputedRef<TooltipStyleCSSDeclaration> = computed(() => {
    const style: TooltipStyleCSSDeclaration = {};
    if (!pointBeingHovered.value) {
      style.visibility = "hidden";
      return style;
    }
    const tooltipWidth = profileTooltipRef.value?.clientWidth ?? 0;
    const chartPosition =
      profileChartContainerRef.value?.getBoundingClientRect();

    let leftPosition =
      pointBeingHovered.value.screenPosition[0] - tooltipWidth / 2.0;
    const topPosition =
      pointBeingHovered.value.screenPosition[1] -
      58 -
      GAP_BETWEEN_TOOLTIP_AND_PROFILE;
    if (chartPosition) {
      if (
        tooltipWidth !== 0 &&
        leftPosition + tooltipWidth > chartPosition.right
      ) {
        leftPosition = chartPosition.right - tooltipWidth;
      }
      if (tooltipWidth !== 0 && leftPosition < chartPosition.left + 55) {
        leftPosition = chartPosition.left + 55;
      }
    }
    style.left = `${leftPosition}px`;
    style.top = `${topPosition}px`;
    return style;
  });

  const chartJsData: ComputedRef<
    ChartData<"line", ElevationProfileChartPoint[]>
  > = computed<ChartData<"line", ElevationProfileChartPoint[]>>(() => {
    const data: ElevationProfileChartPoint[] = profilePoints.value.map(
      (point) => ({
        x: point.dist ?? 0,
        y: point.elevation ?? null,
        ...point,
      }),
    );

    const lineFill: ComplexFillTarget = {
      target: "origin",
      above: FILL_COLOR,
      below: FILL_COLOR,
    };

    const lineOptions: Partial<LineOptions> = {
      borderColor: BORDER_COLOR,
      borderWidth: 1,
      fill: lineFill,
      cubicInterpolationMode: "monotone",
    };

    const pointOptions: Partial<PointPrefixedOptions> = { pointRadius: 1 };
    const pointHoverOptions: Partial<PointPrefixedHoverOptions> = {
      pointHoverRadius: 3,
    };

    const dataset: ChartDataset<"line", ElevationProfileChartPoint[]> = {
      data,
      ...lineOptions,
      ...pointOptions,
      ...pointHoverOptions,
    };
    return { datasets: [dataset] };
  });

  const chartJsScalesConfiguration: ComputedRef<
    { [key: string]: ScaleOptions<"linear"> } | undefined
  > = computed(() => {
    if (!profileMetadata.value) {
      return;
    }
    const scales: { [key: string]: ScaleOptions<"linear"> } = {
      x: {
        type: "linear",
        max: totalLinearDist.value,
        title: {
          display: true,
          text: `${profileLabels.value.xAxis} [${unitUsedOnDistanceAxis.value}]`,
          font: { weight: "bold" },
          padding: 0,
        },
        ticks: {
          callback: (val: number | string) =>
            round(Number(val) * factorToUseForDisplayedDistances.value, 1),
        },
      },
      y: {
        title: {
          display: true,
          text: `${profileLabels.value.yAxis} [m]`,
          font: { weight: "bold" },
        },
        min: yAxisMinimumValue.value,
        max: yAxisMaxValue.value,
      },
    };
    return scales;
  });

  const chartJsTooltipConfiguration = computed(() => {
    return {
      enabled: false,
      external: (tooltipModel: {
        chart: Chart;
        tooltip: TooltipModel<"line">;
      }) => {
        const { chart, tooltip } = tooltipModel;
        if (!tooltip.dataPoints) {
          return;
        }
        const tooltipElement = profileTooltipRef.value;
        if (!tooltipElement) {
          return;
        }
        if (tooltipElement.style.opacity === "0") {
          clearHoverPosition();
          return;
        }
        if (tooltip.dataPoints.length > 0 && track.value) {
          const point: TooltipItem<"line"> = tooltip.dataPoints[0];
          const raw = point.raw as ElevationProfileChartPoint;
          const chartPosition = chart.canvas.getBoundingClientRect();
          pointBeingHovered.value = {
            elevation: raw.elevation,
            dist: round(
              (raw.dist ?? 0) * factorToUseForDisplayedDistances.value,
              2,
            ),
            coordinate: raw.coordinate,
            screenPosition: [
              round(point.element.x + chartPosition.left),
              round(point.element.y + chartPosition.top),
            ],
            hasElevationData: raw.hasElevationData,
          };
        } else {
          clearHoverPosition();
        }
      },
    };
  });

  const chartJsZoomOptions: ComputedRef<ZoomPluginOptions | undefined> =
    computed(() => {
      if (!profileMetadata.value) {
        return;
      }
      const zoomOptions: ZoomPluginOptions = {
        limits: {
          x: {
            min: 0,
            max: totalLinearDist.value,
            minRange: unitUsedOnDistanceAxis.value === "km" ? 3000 : 100,
          },
          y: { min: 0, max: maxElevation.value, minRange: 10 },
        },
        pan: {
          enabled: true,
          mode: "x",
          onPanStart: stopPositionTracking,
          onPanComplete: startPositionTracking,
        },
        zoom: {
          pinch: { enabled: true },
          wheel: { enabled: true },
          drag: { enabled: true, modifierKey: "shift" },
          mode: "x",
          onZoomStart: stopPositionTracking,
          onZoomComplete: startPositionTracking,
        },
      };
      return zoomOptions;
    });

  const chartJsOptions: ComputedRef<ChartOptions<"line"> | undefined> =
    computed(() => {
      if (
        !chartJsScalesConfiguration.value ||
        !chartJsTooltipConfiguration.value ||
        !chartJsZoomOptions.value ||
        !toValue(profile)
      ) {
        return;
      }
      const options: ChartOptions<"line"> = {
        animation: { duration: 250 },
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 100,
        plugins: {
          zoom: chartJsZoomOptions.value,
          legend: { display: false },
          tooltip: chartJsTooltipConfiguration.value,
          noData: {
            points: profilePoints.value,
            noDataText: profileLabels.value.noData,
          },
          dataModel: { dataModelName: profileMetadata.value.dataModel },
        } as ChartOptions<"line">["plugins"],
        scales: chartJsScalesConfiguration.value,
        interaction: { mode: "index", intersect: false },
      };
      return options;
    });

  let resizeObserver: ResizeObserver | undefined;
  onMounted(() => {
    window.addEventListener("beforeprint", resizeChartForPrint);
    window.addEventListener("afterprint", resizeChart);
    if (profileChartContainerRef.value) {
      resizeObserver = new ResizeObserver(resizeChart);
      resizeObserver.observe(profileChartContainerRef.value);
    }
  });

  onUnmounted(() => {
    window.removeEventListener("beforeprint", resizeChartForPrint);
    window.removeEventListener("afterprint", resizeChart);
    resizeObserver?.disconnect();
  });

  function startPositionTracking() {
    track.value = true;
  }
  function stopPositionTracking(): boolean {
    track.value = false;
    return true;
  }
  function clearHoverPosition() {
    pointBeingHovered.value = undefined;
  }
  function resetZoomToBaseValue() {
    if (chartRef.value?.chart) {
      resetZoom(chartRef.value.chart, "none");
    }
  }
  function resizeChartForPrint() {
    chartRef.value?.chart?.resize(1024, 1024);
  }
  function resizeChart() {
    chartRef.value?.chart?.resize();
  }

  return {
    pointBeingHovered,
    unitUsedOnDistanceAxis,
    chartJsData,
    chartJsOptions,
    startPositionTracking,
    stopPositionTracking,
    clearHoverPosition,
    resetZoomToBaseValue,
    tooltipStyle,
  };
}
