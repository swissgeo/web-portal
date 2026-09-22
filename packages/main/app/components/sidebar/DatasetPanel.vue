<script lang="ts" setup>
import { useLayerStore, makeServerLayer } from "@swissgeo/layers";
import log from "@swissgeo/log";
import { useDatasetPanelStore } from "@swissgeo/skeleton";
import { computed } from "vue";

const props = defineProps<{
  detailPagePath?: string;
  backToCatalog?: boolean;
}>();

const emit = defineEmits<{ back: []; close: [] }>();

const datasetPanelStore = useDatasetPanelStore();
const layerStore = useLayerStore();

const { dataset, distributionCollection, isLoading, error } = useDatasetRecord(
  () => datasetPanelStore.activeDatasetId,
);

const isAlreadyOnMap = computed(() => {
  if (!dataset.value) {
    return false;
  }
  return layerStore.layers.some((l) => l.humanId === dataset.value!.id);
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
  if (!dataset.value || isAlreadyOnMap.value) {
    return;
  }
  try {
    layerStore.addLayer(makeServerLayer(dataset.value));
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
    class="flex h-full min-h-0 flex-col border-r border-default bg-default"
    aria-labelledby="dataset-panel-title"
    data-testid="dataset-panel"
  >
    <header class="flex flex-col gap-space-m p-space-m">
      <div class="flex items-center justify-between gap-space-s">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          @click="emit('back')"
        >
          {{ backLabel }}
        </UButton>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          :aria-label="$t('dataset.close')"
          @click="emit('close')"
        />
      </div>
      <h1 id="dataset-panel-title" class="text-2xl font-bold text-primary">
        {{ dataset?.properties.title }}
      </h1>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto px-space-m pb-space-m">
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
        :dataset="dataset"
        :distribution-collection="distributionCollection ?? null"
      />
    </div>

    <footer
      class="flex flex-wrap gap-space-s border-t border-default p-space-m"
    >
      <UButton
        v-if="dataset && !isAlreadyOnMap"
        icon="i-lucide-map"
        color="primary"
        class="w-full justify-center"
        @click="addToMap"
      >
        {{ $t("dataset.addToMap") }}
      </UButton>
      <div
        v-else-if="dataset && isAlreadyOnMap"
        class="flex w-full items-center justify-center gap-2 text-sm text-muted"
      >
        <UIcon name="i-lucide-check" class="size-4" />
        {{ $t("dataset.alreadyOnMap") }}
      </div>
      <UButton
        v-if="dataset && props.detailPagePath"
        :to="props.detailPagePath"
        icon="i-lucide-external-link"
        color="primary"
        variant="ghost"
        class="w-full justify-center"
        @click="datasetPanelStore.closeDatasetPanel()"
      >
        {{ $t("dataset.viewDetailPage") }}
      </UButton>
    </footer>
  </section>
</template>
