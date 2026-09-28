<script setup lang="ts">
import type { CircleMetrics } from "@swissgeo/drawing";

import { useDrawing } from "@swissgeo/drawing";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const { fillColor, strokeColor, strokeWidth, focusedFeatureMetrics } =
  useDrawing();
</script>

<template>
  <div
    class="space-y-4 border-t border-default pt-4"
    data-testid="circle-style-editor"
  >
    <h4 class="text-xs font-semibold tracking-wide text-muted uppercase">
      {{ t("toolbox.drawing.style.appearance") }}
    </h4>
    <div class="space-y-3">
      <label class="flex items-center justify-between gap-3 text-sm text-toned">
        {{ t("toolbox.drawing.style.fillColor") }}
        <span class="flex items-center gap-2">
          <span
            class="font-mono text-xs text-muted uppercase"
            aria-hidden="true"
            >{{ fillColor }}</span
          >
          <input
            v-model="fillColor"
            type="color"
            class="size-8 shrink-0 cursor-pointer rounded-md border border-default bg-default p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-testid="circle-fill-color"
          />
        </span>
      </label>
      <label class="flex items-center justify-between gap-3 text-sm text-toned">
        {{ t("toolbox.drawing.style.outlineColor") }}
        <span class="flex items-center gap-2">
          <span
            class="font-mono text-xs text-muted uppercase"
            aria-hidden="true"
            >{{ strokeColor }}</span
          >
          <input
            v-model="strokeColor"
            type="color"
            class="size-8 shrink-0 cursor-pointer rounded-md border border-default bg-default p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-testid="circle-stroke-color"
          />
        </span>
      </label>
      <label class="flex items-center justify-between gap-3 text-sm text-toned">
        {{ t("toolbox.drawing.style.outlineWidth") }}
        <span class="flex items-center gap-2">
          <input
            v-model.number="strokeWidth"
            type="number"
            min="0"
            step="1"
            class="w-20 rounded-md border border-default bg-default px-2.5 py-1.5 text-right text-sm text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-testid="circle-stroke-width"
          />
          <span class="text-xs text-muted">px</span>
        </span>
      </label>
    </div>
    <dl
      v-if="focusedFeatureMetrics"
      class="space-y-2 rounded-lg bg-elevated/50 p-3 text-xs"
    >
      <div
        class="flex items-center justify-between gap-3"
        data-testid="circle-perimeter"
      >
        <dt class="text-muted">{{ t("toolbox.drawing.metrics.perimeter") }}</dt>
        <dd class="font-medium text-toned tabular-nums">
          {{
            Math.round(
              (focusedFeatureMetrics as CircleMetrics).perimeterMeters,
            ).toLocaleString(locale)
          }}
          m
        </dd>
      </div>
      <div
        class="flex items-center justify-between gap-3"
        data-testid="circle-radius"
      >
        <dt class="text-muted">{{ t("toolbox.drawing.metrics.radius") }}</dt>
        <dd class="font-medium text-toned tabular-nums">
          {{
            Math.round(
              (focusedFeatureMetrics as CircleMetrics).radiusMeters,
            ).toLocaleString(locale)
          }}
          m
        </dd>
      </div>
      <div
        class="flex items-center justify-between gap-3"
        data-testid="circle-area"
      >
        <dt class="text-muted">{{ t("toolbox.drawing.metrics.area") }}</dt>
        <dd class="font-medium text-toned tabular-nums">
          {{
            Math.round(
              (focusedFeatureMetrics as CircleMetrics).areaSquareMeters,
            ).toLocaleString(locale)
          }}
          m²
        </dd>
      </div>
    </dl>
  </div>
</template>
