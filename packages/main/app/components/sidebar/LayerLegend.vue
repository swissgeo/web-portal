<script lang="ts" setup>
import type { Legend } from "@swissgeo/ogc";

import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { legends, presentation = "sidebar" } = defineProps<{
  legends: Legend[];
  presentation?: "sidebar" | "detail";
}>();

const { t } = useI18n();
const isMobile = useBreakpoints(breakpointsTailwind).smallerOrEqual("md");

const failedHrefs = ref<string[]>([]);
const openModal = ref(false);
const selectedLegend = ref<Legend | null>(null);

const {
  imageStyle: modalImageStyle,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  reset: resetZoom,
} = useImageZoom();

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

function handleLegendClick(legend: Legend) {
  if (imageLegends.value.includes(legend)) {
    selectedLegend.value = legend;
    openModal.value = true;
  }
}

function handleModalClose() {
  openModal.value = false;
  selectedLegend.value = null;
  resetZoom();
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
    <span
      v-if="presentation === 'sidebar'"
      class="text-xs font-medium text-toned uppercase"
    >
      {{ t("layers.legend.title") }}
    </span>

    <!-- External PNG legends contain fixed text and symbol colors that we cannot control hence white bg -->
    <div
      v-if="imageLegends.length"
      class="rounded border border-default bg-white p-2"
      :class="{
        'max-h-64 overflow-auto': presentation === 'sidebar',
        'w-fit max-w-full': presentation === 'detail',
      }"
    >
      <img
        v-for="legend in imageLegends"
        :key="legend.href"
        :src="legend.href"
        :alt="t('layers.legend.title')"
        class="max-w-full"
        :class="{
          'cursor-pointer': isMobile,
        }"
        @error="failedHrefs.push(legend.href)"
        @click="isMobile ? handleLegendClick(legend) : null"
      />
      <UModal
        v-if="isMobile"
        v-model:open="openModal"
        @close:prevent="handleModalClose"
        :ui="{
          content: 'bg-transparent ring-0 shadow-none gap-4',
          header: 'p-0 sm:p-0 self-end border-b-0',
          body: 'p-0 sm:p-0',
        }"
      >
        <template #header>
          <UButton
            icon="i-lucide-x"
            variant="solid"
            color="neutral"
            class="self-end"
            @click="handleModalClose"
          />
        </template>
        <template #body>
          <div
            class="w-full touch-none overflow-hidden rounded-md bg-white p-2 select-none"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerEnd"
            @pointercancel="onPointerEnd"
          >
            <img
              v-if="selectedLegend"
              :src="selectedLegend.href"
              :alt="t('layers.legend.title')"
              :style="modalImageStyle"
              class="will-change-transform"
              draggable="false"
            />
          </div>
        </template>
      </UModal>
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

    <span v-if="!legends.length" class="text-sm text-toned">
      {{ t("layers.legend.notAvailable") }}
    </span>
  </div>
</template>
