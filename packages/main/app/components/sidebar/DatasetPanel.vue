<script lang="ts" setup>
import type { Dataset, DistributionCollection } from "@swissgeo/ogc";

import DatasetCopyLink from "~/components/dataset/DatasetCopyLink.vue";
import DatasetLanguageSection from "~/components/dataset/DatasetLanguageSection.vue";
import DatasetMapAction from "~/components/dataset/DatasetMapAction.vue";
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

const backLabel = computed(() => {
  if (props.backToCatalog) {
    return t("dataset.backToCatalog");
  }
  return t("dataset.backToMap");
});
</script>

<template>
  <section
    class="@container flex min-h-full flex-col border-r border-default bg-default"
    aria-labelledby="dataset-panel-title"
    data-testid="dataset-panel"
  >
    <!-- Desktop keeps the whole header in view. Phones keep only the back and close
         row, so the small drawer has room for the content. The header uses
         display: contents on phones, because a sticky row only sticks inside its parent. -->
    <header
      class="contents md:sticky md:top-0 md:z-10 md:flex md:shrink-0 md:flex-col md:gap-space-m md:bg-default md:p-4 lg:gap-8 lg:p-8"
    >
      <div
        class="sticky top-0 z-10 flex items-center justify-between gap-space-s bg-default px-4 pt-4 pb-space-xs md:static md:p-0"
      >
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
            :aria-label="t('dataset.close')"
            @click="emit('close')"
          />
        </div>
      </div>
      <div
        class="flex flex-col items-start gap-space-s p-4 md:p-0 @2xl:flex-row @2xl:items-center @2xl:justify-between"
      >
        <!-- Reserve space on the last title line for the share button. -->
        <div class="min-w-0">
          <h1
            id="dataset-panel-title"
            data-testid="dataset-title"
            class="inline pr-10 text-xl leading-heading font-semibold wrap-anywhere text-highlighted @2xl:text-3xl"
          >
            {{ dataset?.properties.title }}
          </h1>
          <DatasetCopyLink class="-ml-8 align-baseline" :url="detailUrl" />
        </div>
        <DatasetMapAction v-if="dataset" :dataset="dataset" />
      </div>
    </header>
    <div class="flex flex-1 flex-col px-4 pb-4 lg:px-8 lg:pb-8">
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
        :distribution-error="distributionError"
      />
      <DatasetLanguageSection :languages="dataset?.properties.languages" />
    </div>
  </section>
</template>
