<script lang="ts" setup>
import type { Distribution } from "@swissgeo/ogc";

import { isStacDistribution } from "~/utils/isStacDistribution";

import DatasetService from "./DatasetService.vue";

const { distributions } = defineProps<{
  distributions: Distribution[];
}>();

const mapServices = computed(() =>
  distributions.filter((distribution) => !isStacDistribution(distribution)),
);
const downloadServices = computed(() =>
  distributions.filter(isStacDistribution),
);
const groups = computed(() => [
  { label: "dataset.mapServices", distributions: mapServices.value },
  { label: "dataset.otherAccess", distributions: downloadServices.value },
]);
</script>

<template>
  <div class="flex flex-col gap-space-m">
    <template v-for="group in groups" :key="group.label">
      <section v-if="group.distributions.length">
        <h4 class="mb-space-xs text-sm font-semibold text-highlighted">
          {{ $t(group.label) }}
        </h4>
        <div class="rounded-md border border-default">
          <div
            class="hidden grid-cols-[7rem_1fr] gap-space-xs border-b border-default p-space-s text-xs font-semibold @2xl:grid"
            aria-hidden="true"
          >
            <span>{{ $t("dataset.format") }}</span>
            <span>{{ $t("dataset.serviceUrl") }}</span>
          </div>
          <ul class="divide-y divide-default">
            <li
              v-for="distribution in group.distributions"
              :key="distribution.id"
            >
              <DatasetService :distribution="distribution" />
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>
