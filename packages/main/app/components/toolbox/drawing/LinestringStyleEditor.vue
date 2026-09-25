<script setup lang="ts">
import type { LineStringMetrics } from "@swissgeo/drawing";

import { useDrawing } from "@swissgeo/drawing";

const { strokeColor, strokeWidth, focusedFeatureMetrics } = useDrawing();
</script>

<template>
  <div
    class="space-y-4 border-t border-default pt-4"
    data-testid="linestring-style-editor"
  >
    <h4 class="text-xs font-semibold tracking-wide text-muted uppercase">
      Appearance
    </h4>
    <div class="space-y-3">
      <label class="flex items-center justify-between gap-3 text-sm text-toned">
        Line color
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
            data-testid="linestring-stroke-color"
          />
        </span>
      </label>
      <label class="flex items-center justify-between gap-3 text-sm text-toned">
        Line width
        <span class="flex items-center gap-2">
          <input
            v-model.number="strokeWidth"
            type="number"
            min="0"
            step="1"
            class="w-20 rounded-md border border-default bg-default px-2.5 py-1.5 text-right text-sm text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-testid="linestring-stroke-width"
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
        data-testid="linestring-length"
      >
        <dt class="text-muted">Length</dt>
        <dd class="font-medium text-toned tabular-nums">
          {{
            Math.round(
              (focusedFeatureMetrics as LineStringMetrics).lengthMeters,
            ).toLocaleString()
          }}
          m
        </dd>
      </div>
    </dl>
  </div>
</template>
