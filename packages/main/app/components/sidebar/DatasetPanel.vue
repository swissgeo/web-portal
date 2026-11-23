<script lang="ts" setup>
import type { Dataset, DistributionCollection } from "@swissgeo/ogc";
import type { DatasetTab } from "~/utils/datasetTab";

import DatasetCopyLink from "~/components/dataset/DatasetCopyLink.vue";
import DatasetMapAction from "~/components/dataset/DatasetMapAction.vue";
import { DEFAULT_DATASET_TAB } from "~/utils/datasetTab";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  dataset: Dataset | null;
  detailUrl: string;
  distributionCollection: DistributionCollection | null;
  distributionError?: boolean;
  isLoading: boolean;
  error?: { message: string } | null;
  backToCatalog?: boolean;
}>();

const emit = defineEmits<{ back: []; close: [] }>();

const { t } = useI18n();

// A language switch reloads the record and unmounts the detail, so the page keeps the tab in the URL.
const tab = defineModel<DatasetTab>("tab", { default: DEFAULT_DATASET_TAB });

const backLabel = computed(() => {
  if (props.backToCatalog) {
    return t("dataset.backToCatalog");
  }
  return t("dataset.backToMap");
});
</script>

<template>
  <section
    class="@container flex min-h-0 flex-1 flex-col bg-default"
    aria-labelledby="dataset-panel-title"
    data-testid="dataset-panel"
  >
    <header
      class="flex shrink-0 flex-col bg-default md:gap-space-m md:p-4 lg:gap-8 lg:p-8"
    >
      <!-- On a phone the close button sits on its own line above the back button. -->
      <div
        class="flex flex-col-reverse items-start px-4 pb-4 md:flex-row md:items-center md:justify-between md:gap-space-s md:p-0"
      >
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          @click="emit('back')"
        >
          {{ backLabel }}
        </UButton>
        <div class="flex items-center gap-space-xs self-end md:self-auto">
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            :aria-label="t('dataset.close')"
            :ui="{ leadingIcon: 'max-md:size-6' }"
            @click="emit('close')"
          />
        </div>
      </div>
      <div
        class="flex flex-col items-start gap-4 px-4 pb-4 md:gap-space-s md:p-0 @2xl:flex-row @2xl:items-center @2xl:justify-between"
      >
        <div
          class="w-full min-w-0 text-xl leading-heading @2xl:w-auto @2xl:text-3xl"
        >
          <h1
            id="dataset-panel-title"
            data-testid="dataset-title"
            class="inline text-xl leading-heading font-semibold wrap-anywhere text-highlighted @2xl:text-3xl"
            :class="dataset?.properties.aggregated ? 'pr-4' : 'pr-10'"
          >
            {{ dataset?.properties.title }}
          </h1>
          <UBadge
            v-if="dataset?.properties.aggregated"
            color="neutral"
            variant="subtle"
            :label="t('dataset.aggregated')"
            class="mr-10 align-middle"
            data-testid="dataset-aggregated"
          />
          <DatasetCopyLink
            class="-ml-7.5 align-middle"
            :ui="{ leadingIcon: 'max-md:size-4' }"
            :url="detailUrl"
            :label="t('dataset.copyLink')"
          />
        </div>
        <DatasetMapAction v-if="dataset" :dataset="dataset" />
      </div>
    </header>
    <div class="flex min-h-0 flex-1 flex-col">
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
        v-model:tab="tab"
        :dataset="dataset"
        :distribution-collection="distributionCollection ?? null"
        :distribution-error="distributionError"
      />
    </div>
  </section>
</template>
