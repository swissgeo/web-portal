<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import { determineFormat } from "~/utils/determineFormat";
import { useI18n } from "vue-i18n";

import DatasetService from "./DatasetService.vue";

const { t } = useI18n();

const { distributions } = defineProps<{
  distributions: Distribution[];
}>();

const visibility = ref<Record<string, boolean>>({});

function isVisible(distribution: Distribution) {
  return visibility.value[distribution.id] !== false;
}

const mapServices = computed(() =>
  distributions.filter(
    (distribution) => determineFormat(distribution) !== "STAC",
  ),
);
const downloadServices = computed(() =>
  distributions.filter(
    (distribution) => determineFormat(distribution) === "STAC",
  ),
);
const groups = computed(() => [
  { label: "dataset.mapServices", distributions: mapServices.value },
  { label: "dataset.otherAccess", distributions: downloadServices.value },
]);
</script>

<template>
  <div class="flex flex-col gap-8">
    <template v-for="group in groups" :key="group.label">
      <section
        v-if="group.distributions.length"
        v-show="group.distributions.some(isVisible)"
      >
        <h4
          class="mb-4 text-base leading-normal font-semibold text-highlighted"
        >
          {{ t(group.label) }}
        </h4>
        <div class="rounded-md border border-accented">
          <div
            class="hidden grid-cols-[7rem_1fr] gap-space-xs border-b border-accented px-space-s py-3.5 text-sm font-bold text-highlighted @2xl:grid"
            aria-hidden="true"
          >
            <span>{{ t("dataset.format") }}</span>
            <span>{{ t("dataset.serviceUrl") }}</span>
          </div>
          <ul class="divide-y divide-accented">
            <li
              v-for="distribution in group.distributions"
              :key="distribution.id"
              v-show="isVisible(distribution)"
              class="hover:bg-elevated"
            >
              <DatasetService
                :distribution="distribution"
                @visibility="visibility[distribution.id] = $event"
              />
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>
