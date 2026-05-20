<script setup lang="ts">
import { registerProj4 } from "@swissgeo/coordinates";
import proj4 from "proj4";
import { computed, ref } from "vue";

import type { ElevationProfileResponse } from "@/types";
import { buildCSV, reverseProfile } from "@/utils/profile";

import type { Labels as MetadataLabels } from "./components/ElevationProfileMetadata.vue";
import type { Labels as PlotLabels } from "./components/ElevationProfilePlot.vue";

import ElevationProfileMetadata from "./components/ElevationProfileMetadata.vue";
import ElevationProfilePlot from "./components/ElevationProfilePlot.vue";

registerProj4(proj4);

export interface Labels {
  plot: PlotLabels;
  metadata: MetadataLabels;
}

const props = withDefaults(
  defineProps<{
    profileResponse: ElevationProfileResponse;
    isLoading: boolean;
    labels: Labels;
    filename?: string;
  }>(),
  {
    filename: "export",
  },
);

const isReverse = ref<boolean>(false);
const profile = computed<ElevationProfileResponse>(() => {
  return isReverse.value
    ? reverseProfile(props.profileResponse)
    : props.profileResponse;
});

function triggerDownload(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = props.filename.endsWith(".csv")
    ? props.filename
    : `${props.filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCSV(profile: ElevationProfileResponse): void {
  triggerDownload(new Blob([buildCSV(profile)], { type: "text/csv" }));
}
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center">
    <ElevationProfilePlot
      v-if="profileResponse"
      :profile="profile"
      :labels="labels.plot"
    >
      <slot />
    </ElevationProfilePlot>
    <ElevationProfileMetadata
      v-if="profileResponse"
      :metadata="profile.metadata"
      :labels="labels.metadata"
    >
      <UButton
        icon="i-lucide-arrow-left-right"
        size="md"
        color="primary"
        variant="solid"
        @click="isReverse = !isReverse"
      />
      <UButton
        icon="i-lucide-download"
        size="md"
        color="primary"
        variant="solid"
        @click="exportCSV(profile)"
      />
    </ElevationProfileMetadata>
  </div>
</template>

<style scoped></style>
