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

// A legend that fails to load (missing file, blocked request, or a format the
// service got wrong) is offered as a link rather than dropped, so the user
// still has a way to reach it
function isDisplayableImage(legend: Legend) {
  return isImage(legend) && !failedHrefs.value.includes(legend.href);
}

function isPdf(legend: Legend) {
  return (
    legend.format === "application/pdf" || /\.pdf(\?|$)/i.test(legend.href)
  );
}

function documentLink(legend: Legend) {
  if (isPdf(legend)) {
    return { icon: "i-lucide-file-text", label: t("layers.legend.openPdf") };
  }
  if (legend.format?.startsWith("text/")) {
    return {
      icon: "i-lucide-external-link",
      label: t("layers.legend.openPage"),
    };
  }
  return {
    icon: "i-lucide-external-link",
    label: t("layers.legend.openDocument"),
  };
}

// Legends that cannot be displayed inline (typically PDFs) are offered as a
// link instead
const imageLegends = computed(() => legends.filter(isDisplayableImage));
const documentLinks = computed(() =>
  legends
    .filter((legend) => !isDisplayableImage(legend))
    .map((legend) => ({ href: legend.href, ...documentLink(legend) })),
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
      v-for="link in documentLinks"
      :key="link.href"
      :to="link.href"
      target="_blank"
      raw
      class="flex items-center gap-1 text-sm"
    >
      <UIcon :name="link.icon" class="size-3 shrink-0" />
      {{ link.label }}
    </ULink>

    <span v-if="!legends.length" class="text-sm text-gray-600">
      {{ t("layers.legend.notAvailable") }}
    </span>
  </div>
</template>
