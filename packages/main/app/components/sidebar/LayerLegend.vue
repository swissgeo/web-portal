<script lang="ts" setup>
import type { Legend } from "@swissgeo/ogc";

import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { legends } = defineProps<{
  legends: Legend[];
}>();

const { t } = useI18n();

const failedHrefs = ref<string[]>([]);

function isImage(legend: Legend) {
  if (legend.format) {
    return legend.format.startsWith("image/");
  }
  // Some services advertise no format at all, so we fall back on the extension
  return /\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(legend.href);
}

// Services do lie about the format, so an image that fails to load is treated
// as a document from then on rather than being dropped altogether
function isDisplayableImage(legend: Legend) {
  return isImage(legend) && !failedHrefs.value.includes(legend.href);
}

function isPdf(legend: Legend) {
  return (
    legend.format === "application/pdf" || /\.pdf(\?|$)/i.test(legend.href)
  );
}

function documentLabel(legend: Legend) {
  if (isPdf(legend)) {
    return t("layers.legend.openPdf");
  }
  if (legend.format?.startsWith("text/")) {
    return t("layers.legend.openPage");
  }
  return t("layers.legend.openDocument");
}

// Legends that cannot be displayed inline (typically PDFs) are offered as a
// link instead
const imageLegends = computed(() => legends.filter(isDisplayableImage));
const documentLegends = computed(() =>
  legends.filter((legend) => !isDisplayableImage(legend)),
);

const hasLegend = computed(
  () => imageLegends.value.length > 0 || documentLegends.value.length > 0,
);
</script>

<template>
  <div data-testid="layer-legend" class="flex flex-col gap-2">
    <span class="text-xs font-medium text-gray-600 uppercase">
      {{ t("layers.legend.title") }}
    </span>

    <div
      v-if="imageLegends.length"
      class="max-h-64 overflow-auto rounded border border-gray-200 p-2"
    >
      <img
        v-for="legend in imageLegends"
        :key="legend.href"
        :src="legend.href"
        :alt="t('layers.legend.title')"
        class="max-w-full"
        @error="failedHrefs.push(legend.href)"
      />
    </div>

    <ULink
      v-for="legend in documentLegends"
      :key="legend.href"
      :to="legend.href"
      target="_blank"
      raw
      class="flex items-center gap-1 text-sm"
    >
      <UIcon
        :name="isPdf(legend) ? 'i-lucide-file-text' : 'i-lucide-external-link'"
        class="size-3 shrink-0"
      />
      {{ documentLabel(legend) }}
    </ULink>

    <span v-if="!hasLegend" class="text-sm text-gray-600">
      {{ t("layers.legend.notAvailable") }}
    </span>
  </div>
</template>
