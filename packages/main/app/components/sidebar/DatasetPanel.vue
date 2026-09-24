<script lang="ts" setup>
import type { Dataset, DistributionCollection } from "@swissgeo/ogc";

import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import log from "@swissgeo/log";
import DatasetCopyLink from "~/components/dataset/DatasetCopyLink.vue";
import DatasetLanguageSection from "~/components/dataset/DatasetLanguageSection.vue";
import DatasetMapAction from "~/components/dataset/DatasetMapAction.vue";
import { computed } from "vue";

const props = defineProps<{
  dataset: Dataset | null;
  detailUrl: string;
  distributionCollection: DistributionCollection | null;
  isLoading: boolean;
  error?: { message: string } | null;
  backToCatalog?: boolean;
}>();

const emit = defineEmits<{ back: []; close: [] }>();

const layerStore = useLayerStore();

const isAlreadyOnMap = computed(() => {
  if (!props.dataset) {
    return false;
  }
  return layerStore.layers.some((l) => l.humanId === props.dataset!.id);
});

const toast = useToaster();
const { t } = useI18n();

const backLabel = computed(() => {
  if (props.backToCatalog) {
    return t("dataset.backToCatalog");
  }
  return t("dataset.backToMap");
});

function addToMap() {
  if (!props.dataset || isAlreadyOnMap.value) {
    return;
  }
  try {
    layerStore.addLayer(makeServerLayer(props.dataset));
  } catch (e) {
    log.error(
      "Failed to add dataset to map",
      e instanceof Error ? e : new Error(String(e)),
    );
    toast.add({
      color: "error",
      title: t("dataset.addToMapError"),
    });
  }
}
</script>

<template>
  <section
    class="@container flex h-full min-h-0 flex-col border-r border-default bg-default"
    aria-labelledby="dataset-panel-title"
    data-testid="dataset-panel"
  >
    <header class="flex shrink-0 flex-col gap-space-m p-4 lg:p-space-m">
      <div class="flex items-center justify-between gap-space-s">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          @click="emit('back')"
        >
          {{ backLabel }}
        </UButton>
        <div class="flex items-center gap-space-xs">
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            :aria-label="$t('dataset.close')"
            @click="emit('close')"
          />
        </div>
      </div>
      <div
        class="flex flex-col items-start gap-space-s @2xl:flex-row @2xl:items-center @2xl:justify-between"
      >
        <div class="flex min-w-0 items-center gap-space-xs">
          <h1
            id="dataset-panel-title"
            class="text-xl leading-heading font-semibold wrap-anywhere text-highlighted @2xl:text-3xl"
          >
            {{ dataset?.properties.title }}
          </h1>
          <DatasetCopyLink class="shrink-0" :url="detailUrl" />
        </div>
        <DatasetMapAction
          :has-dataset="Boolean(dataset)"
          :is-already-on-map="isAlreadyOnMap"
          @add-to-map="addToMap"
        />
      </div>
    </header>
    <div
      class="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 lg:px-space-m lg:pb-space-m"
    >
      <div v-if="isLoading" class="flex h-full items-center justify-center">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-6 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="error"
        class="flex h-full items-center justify-center text-sm text-red-500"
      >
        {{ error.message }}
      </div>

      <DatasetDetail
        v-else-if="dataset"
        class="shrink-0"
        :dataset="dataset"
        :distribution-collection="distributionCollection ?? null"
      />
      <DatasetLanguageSection :languages="dataset?.properties.languages" />
    </div>
  </section>
</template>
