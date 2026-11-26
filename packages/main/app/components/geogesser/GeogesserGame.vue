<script setup lang="ts">
/**
 * Geogesser: a hidden game that the search text "geoguessinggame" opens. A small map
 * shows an aerial image of a random Swiss place. The user clicks on the main
 * map where the place is. "Bigger view" shows more of the area, but removes
 * points.
 */
import type MapBrowserEvent from "ol/MapBrowserEvent";
import type { Ref } from "vue";

import { LV95 } from "@swissgeo/coordinates";
import {
  getLV95ViewConfig,
  getLV95WMTSTileGrid,
} from "@swissgeo/coordinates/ol";
import { Map as OlMap, View } from "ol";
import { boundingExtent } from "ol/extent";
import Feature from "ol/Feature";
import { LineString, Point } from "ol/geom";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource, XYZ } from "ol/source";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";
import { useI18n } from "vue-i18n";

import {
  GEOGESSER_MAX_ZOOM_OUTS,
  GEOGESSER_ROUND_SECONDS,
  formatGeogesserDistance,
  geogesserDistance,
  geogesserScore,
  pickGeogesserTarget,
} from "@/utils/geogesser";

type Round = {
  name: string;
  target: [number, number];
  zoomOuts: number;
  secondsLeft: number;
  guess?: number[];
  distance?: number;
  score?: number;
};

const SWISSIMAGE_URL =
  "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/2056/{z}/{x}/{y}.jpeg";
// 0.5 m/px: houses and roads show, but the area is small
const START_RESOLUTION = 0.5;

const { t } = useI18n();
const geogesserStore = useGeogesserStore();
const olMap = inject<Ref<OlMap | undefined>>("olMap");
const photoElement = useTemplateRef<HTMLElement>("photo");

const round = ref<Round>(newRound());
const totalScore = ref(0);
const isFinished = computed(() => round.value.score !== undefined);
const canZoomOut = computed(
  () => !isFinished.value && round.value.zoomOuts < GEOGESSER_MAX_ZOOM_OUTS,
);

function newRound(): Round {
  const { name, coordinate } = pickGeogesserTarget();
  return {
    name,
    target: coordinate,
    zoomOuts: 0,
    secondsLeft: GEOGESSER_ROUND_SECONDS,
  };
}

// The photo map has no interactions: the user must not pan or zoom it for free
const photoView = new View({
  ...getLV95ViewConfig(),
  center: round.value.target,
  resolution: START_RESOLUTION,
});
let photoMap: OlMap | undefined;

onMounted(() => {
  photoMap = new OlMap({
    target: photoElement.value ?? undefined,
    controls: [],
    interactions: [],
    layers: [
      new TileLayer({
        source: new XYZ({
          url: SWISSIMAGE_URL,
          projection: LV95.epsg,
          tileGrid: getLV95WMTSTileGrid(),
        }),
      }),
    ],
    view: photoView,
  });
});

const TARGET_COLOR = "#16a34a";
const GUESS_COLOR = "#2563eb";
// the panel covers the right side of the map: the result must not be under it
const RESULT_PADDING = [100, 340, 100, 100];

function labelText(text: string, offsetY = -22): Text {
  return new Text({
    text,
    offsetY,
    font: "bold 14px sans-serif",
    fill: new Fill({ color: "#111827" }),
    // a box, so that the label stays readable over the map labels
    backgroundFill: new Fill({ color: "#ffffff" }),
    backgroundStroke: new Stroke({ color: "#111827", width: 1 }),
    padding: [2, 6, 2, 6],
  });
}

function pointStyle(color: string, label: string): Style {
  return new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#ffffff", width: 3 }),
    }),
    text: labelText(label),
  });
}

// The result shows where the place is, where the user clicked, and the
// distance between them on the line
const resultSource = new VectorSource();
const resultLayer = new VectorLayer({ source: resultSource, zIndex: 1000 });

function showResult(
  target: number[],
  guess: number[] | undefined,
  distance: number | undefined,
) {
  resultSource.clear();
  const targetFeature = new Feature(new Point(target));
  targetFeature.setStyle(pointStyle(TARGET_COLOR, round.value.name));
  resultSource.addFeature(targetFeature);
  if (guess && distance !== undefined) {
    const guessFeature = new Feature(new Point(guess));
    guessFeature.setStyle(pointStyle(GUESS_COLOR, t("geogesser.your_guess")));
    const lineFeature = new Feature(new LineString([guess, target]));
    lineFeature.setStyle(
      new Style({
        stroke: new Stroke({ color: "#111827", width: 3, lineDash: [8, 6] }),
        text: labelText(formatGeogesserDistance(distance), 0),
      }),
    );
    resultSource.addFeatures([lineFeature, guessFeature]);
  }
  olMap?.value
    ?.getView()
    .fit(boundingExtent(guess ? [guess, target] : [target]), {
      padding: RESULT_PADDING,
      maxZoom: 8,
      duration: 500,
    });
}

function zoomOut() {
  if (!canZoomOut.value) {
    return;
  }
  round.value.zoomOuts += 1;
  photoView.setResolution(START_RESOLUTION * 2 ** round.value.zoomOuts);
}

function finish(guess: number[] | undefined) {
  if (isFinished.value) {
    return;
  }
  const { target, zoomOuts } = round.value;
  if (guess) {
    const distance = geogesserDistance(guess, target);
    round.value.guess = guess;
    round.value.distance = distance;
    round.value.score = geogesserScore(distance, zoomOuts);
  } else {
    round.value.score = 0;
  }
  totalScore.value += round.value.score;
  showResult(target, guess, round.value.distance);
}

function restart() {
  resultSource.clear();
  round.value = newRound();
  photoView.setCenter(round.value.target);
  photoView.setResolution(START_RESOLUTION);
}

const timer = setInterval(() => {
  if (isFinished.value) {
    return;
  }
  round.value.secondsLeft -= 1;
  if (round.value.secondsLeft <= 0) {
    finish(undefined);
  }
}, 1000);

function onMapClick(event: MapBrowserEvent) {
  finish(event.coordinate);
}

watch(
  () => olMap?.value,
  (map) => {
    if (!map) {
      return;
    }
    map.addLayer(resultLayer);
    map.on("singleclick", onMapClick);
    return () => {
      map.un("singleclick", onMapClick);
      map.removeLayer(resultLayer);
    };
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearInterval(timer);
  olMap?.value?.un("singleclick", onMapClick);
  olMap?.value?.removeLayer(resultLayer);
  photoMap?.setTarget(undefined);
});
</script>

<template>
  <UCard
    data-testid="geogesser"
    class="absolute top-4 right-4 z-20 w-72 shadow-lg"
    :ui="{ body: 'p-3 sm:p-3', header: 'p-3 sm:p-3' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <span class="font-semibold">{{ t("geogesser.title") }}</span>
        <span class="text-sm tabular-nums">
          {{ t("geogesser.total", { points: totalScore }) }}
        </span>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="t('geogesser.close')"
          data-testid="geogesser-close"
          @click="geogesserStore.close()"
        />
      </div>
    </template>

    <div
      ref="photo"
      data-testid="geogesser-photo"
      class="aspect-square w-full overflow-hidden rounded bg-neutral-200"
    />

    <div class="mt-2 flex items-center justify-between text-sm">
      <span data-testid="geogesser-time" class="tabular-nums">
        {{ t("geogesser.time_left", { seconds: round.secondsLeft }) }}
      </span>
      <span class="tabular-nums">
        {{ t("geogesser.zoom_outs", { count: round.zoomOuts }) }}
      </span>
    </div>

    <p v-if="!isFinished" class="mt-2 text-sm">
      {{ t("geogesser.instructions") }}
    </p>
    <div v-else data-testid="geogesser-result" class="mt-2">
      <template v-if="round.distance !== undefined">
        <p class="text-2xl font-bold tabular-nums">
          {{ formatGeogesserDistance(round.distance) }}
        </p>
        <p class="text-sm">
          {{ t("geogesser.result", { name: round.name, points: round.score }) }}
        </p>
      </template>
      <p v-else class="text-sm">
        {{ t("geogesser.time_up", { name: round.name }) }}
      </p>
    </div>

    <div class="mt-3 flex gap-2">
      <UButton
        v-if="!isFinished"
        icon="i-lucide-zoom-out"
        color="neutral"
        variant="outline"
        size="sm"
        :disabled="!canZoomOut"
        data-testid="geogesser-zoom-out"
        @click="zoomOut"
      >
        {{ t("geogesser.bigger_view") }}
      </UButton>
      <UButton
        icon="i-lucide-rotate-ccw"
        size="sm"
        data-testid="geogesser-restart"
        @click="restart"
      >
        {{ isFinished ? t("geogesser.next_round") : t("geogesser.new_place") }}
      </UButton>
    </div>
  </UCard>
</template>
