<!-- eslint-disable -->
<script setup lang="ts">
import type { Labels } from "@swissgeo/elevation-profile";
import type { LineString } from "geojson";
import type { Feature } from "ol";
import type {
  LineString as OlLineString,
  Polygon as OlPolygon,
  Geometry,
} from "ol/geom";
import type Map from "ol/Map";
import type { Ref } from "vue";

import { X, GripVertical } from "@lucide/vue";
import { resolveFeatureId } from "@swissgeo/drawing";
import {
  ElevationProfile,
  ElevationProfileOpenLayersBridge,
} from "@swissgeo/elevation-profile";
import { usePositionStore } from "@swissgeo/map";
import GeoJSON from "ol/format/GeoJSON";
import {
  computed,
  inject,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onBeforeMount,
  reactive,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";

const WINDOW_MARGIN = 16;
const DEFAULT_WIDTH = 800;

const olMapRef = inject<Ref<Map | undefined>>("olMap");

const geometryRevision = ref(0);

const mapProjectionEpsg = computed(() => positionStore.projection.epsg);
const olGeoJSON = computed(
  () =>
    new GeoJSON({
      featureProjection: mapProjectionEpsg.value,
      dataProjection: mapProjectionEpsg.value,
    }),
);
const olMap = computed(() => {
  return olMapRef?.value ? markRaw(olMapRef.value) : undefined;
});
const labels = computed<Labels>(() => ({
  plot: {
    xAxis: t("elevationProfile.plot.xAxis"),
    yAxis: t("elevationProfile.plot.yAxis"),
    noData: t("elevationProfile.plot.noData"),
  },
  metadata: {
    elevationDifference: t("elevationProfile.metadata.elevationDifference"),
    elevationUp: t("elevationProfile.metadata.elevationUp"),
    elevationDown: t("elevationProfile.metadata.elevationDown"),
    poiUp: t("elevationProfile.metadata.poiUp"),
    poiDown: t("elevationProfile.metadata.poiDown"),
    distance: t("elevationProfile.metadata.distance"),
    slopeDistance: t("elevationProfile.metadata.slopeDistance"),
  },
}));
// const hasInfo = computed(
//   () => drawingStore.isDrawing && Boolean(drawingStore.selectedFeatureInfo),
// );

// const selectedLineString = computed<LineString | null>(() => {
//   void geometryRevision.value;

//   const selectedId = drawingStore.selectedFeatureId;
//   if (!selectedId) {
//     return null;
//   }

//   const features = drawingStore.drawingFeatures as Feature<Geometry>[];
//   const feature =
//     features.find((f) => resolveFeatureId(f) === selectedId) ?? null;
//   const geometry = feature?.getGeometry();
//   const type = geometry?.getType();

//   if (type === "LineString") {
//     return olGeoJSON.value.writeGeometryObject(
//       geometry as OlLineString,
//     ) as LineString;
//   }

//   if (type === "Polygon") {
//     const ring = (geometry as OlPolygon).getLinearRing(0);
//     if (!ring) {
//       return null;
//     }
//     const coords = ring.getCoordinates();
//     return { type: "LineString", coordinates: coords };
//   }

//   return null;
// });

const position = reactive({
  x: WINDOW_MARGIN,
  y: WINDOW_MARGIN,
  initialized: false,
});
const size = reactive({
  width: DEFAULT_WIDTH,
  height: "auto",
});
const dragState = reactive({
  active: false,
  offsetX: 0,
  offsetY: 0,
});

const positionStore = usePositionStore();
const { t } = useI18n();
const windowRef = useTemplateRef<HTMLElement>("windowRef");
const { elevationProfile, elevationPending, elevationError } =
  useElevationProfile(
    selectedLineString,
    () => positionStore.projection.epsgNumber,
  );

let unlistenGeometryChange: (() => void) | null = null;

function clampToViewport(nextX: number, nextY: number) {
  if (typeof window === "undefined") {
    return { x: nextX, y: nextY };
  }

  const element = windowRef.value;
  const width = element?.offsetWidth ?? size.width;
  const height = element?.offsetHeight ?? 220;
  const maxX = Math.max(
    WINDOW_MARGIN,
    window.innerWidth - width - WINDOW_MARGIN,
  );
  const maxY = Math.max(
    WINDOW_MARGIN,
    window.innerHeight - height - WINDOW_MARGIN,
  );

  return {
    x: Math.min(Math.max(nextX, WINDOW_MARGIN), maxX),
    y: Math.min(Math.max(nextY, WINDOW_MARGIN), maxY),
  };
}

async function ensureInitialPosition() {
  if (position.initialized) {
    return;
  }

  await nextTick();

  if (typeof window === "undefined") {
    position.initialized = true;
    return;
  }

  const initial = clampToViewport(WINDOW_MARGIN, WINDOW_MARGIN);
  position.x = initial.x;
  position.y = initial.y;
  position.initialized = true;
}

function onDragMove(event: PointerEvent) {
  if (!dragState.active) {
    return;
  }

  const clamped = clampToViewport(
    event.clientX - dragState.offsetX,
    event.clientY - dragState.offsetY,
  );
  position.x = clamped.x;
  position.y = clamped.y;
}

function stopDrag() {
  if (!dragState.active || typeof window === "undefined") {
    return;
  }

  dragState.active = false;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0 || !windowRef.value || typeof window === "undefined") {
    return;
  }

  const rect = windowRef.value.getBoundingClientRect();
  dragState.active = true;
  dragState.offsetX = event.clientX - rect.left;
  dragState.offsetY = event.clientY - rect.top;

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
}

function handleWindowResize() {
  const clamped = clampToViewport(position.x, position.y);
  position.x = clamped.x;
  position.y = clamped.y;
}

watch(
  hasInfo,
  async (visible) => {
    if (!visible) {
      return;
    }

    await ensureInitialPosition();
    handleWindowResize();
  },
  { immediate: true },
);

// TODO: adapt to the new drawing module
// watch(
//   () => drawingStore.selectedFeatureId,
//   (selectedId) => {
//     unlistenGeometryChange?.();
//     unlistenGeometryChange = null;

//     if (!selectedId) {
//       return;
//     }

//     const features = drawingStore.drawingFeatures as Feature<Geometry>[];
//     const feature = features.find((f) => resolveFeatureId(f) === selectedId);
//     if (!feature) {
//       return;
//     }

//     const key = feature.on("change", () => {
//       geometryRevision.value++;
//     });
//     unlistenGeometryChange = () => feature.un("change", key.listener);
//   },
//   { immediate: true },
// );

onBeforeMount(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleWindowResize);
  }
});

onBeforeUnmount(() => {
  stopDrag();
  // unlistenGeometryChange?.();
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleWindowResize);
  }
});
</script>

<template>
  <div
    ref="windowRef"
    v-if="hasInfo && selectedLineString"
    class="fixed z-9998"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.width}px`,
      height: size.height === 'auto' ? 'auto' : `${size.height}px`,
    }"
  >
    <UCard class="h-full shadow-lg" :ui="{ body: 'h-full overflow-auto' }">
      <template #header>
        <div
          class="flex items-center justify-between select-none"
          :class="dragState.active ? 'cursor-grabbing' : 'cursor-grab'"
          @pointerdown.prevent="startDrag"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs leading-none text-gray-400">
              <GripVertical :size="14" />
            </span>
            <p class="text-sm font-medium text-gray-700">
              {{ t("elevationProfile.windowTitle") }}
            </p>
          </div>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            square
            @pointerdown.stop
            @click="closeWindow"
          >
            <X :size="14" />
          </UButton>
        </div>
      </template>

      <USkeleton v-if="elevationPending" class="h-40 w-full" />
      <div
        v-else-if="elevationError"
        class="flex h-40 items-center justify-center text-sm text-red-500"
      >
        {{ t("elevationProfile.fetchError") }}
      </div>
      <ElevationProfile
        v-else-if="elevationProfile"
        :profile-response="elevationProfile"
        :is-loading="false"
        :labels="labels"
      >
        <ElevationProfileOpenLayersBridge
          v-if="olMap"
          :ol-instance="olMap"
          :map-projection="mapProjectionEpsg"
        />
      </ElevationProfile>
    </UCard>
  </div>
</template>
