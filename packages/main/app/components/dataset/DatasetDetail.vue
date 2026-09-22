<script lang="ts" setup>
import type {
  Dataset,
  DistributionCollection,
  Distribution,
  Link,
} from "@swissgeo/ogc";

import { computed } from "vue";

import DatasetContact from "./DatasetContact.vue";
import DatasetLinkList from "./DatasetLinkList.vue";
import DatasetServiceList from "./DatasetServiceList.vue";

const props = defineProps<{
  dataset: Dataset;
  distributionCollection: DistributionCollection | null;
}>();

const contacts = computed(() =>
  (props.dataset.properties.contacts ?? []).filter(
    (contact) =>
      contact.organization?.trim() ||
      contact.role?.trim() ||
      contact.country?.trim(),
  ),
);

const EXCLUDED_LINK_RELS = new Set(["self", "collection", "distributions"]);

const displayLinks = computed<Link[]>(() => {
  if (!props.dataset.links) {
    return [];
  }
  return props.dataset.links.filter(
    (l) => !EXCLUDED_LINK_RELS.has(l.rel?.toLowerCase() ?? ""),
  );
});

const serviceDistributions = computed<Distribution[]>(() => {
  if (!props.distributionCollection?.features) {
    return [];
  }
  return props.distributionCollection.features.filter((distribution) => {
    const protocol = distribution.properties.protocol?.toLowerCase();
    return (
      distribution.properties.metaInformation !== true &&
      (protocol === "ogc:wms" || protocol === "ogc:wmts")
    );
  });
});
</script>

<template>
  <div class="@container flex flex-col gap-6">
    <div
      v-if="dataset.properties.description || contacts.length"
      class="grid gap-space-m"
      :class="{
        '@xl:grid-cols-2': dataset.properties.description && contacts.length,
      }"
    >
      <section v-if="dataset.properties.description">
        <h3 class="mb-space-s text-base font-semibold text-highlighted">
          {{ $t("dataset.abstract") }}
        </h3>
        <p
          class="text-base leading-normal wrap-anywhere whitespace-pre-line text-default"
          data-testid="dataset-description"
        >
          {{ dataset.properties.description }}
        </p>
      </section>

      <section v-if="contacts.length" data-testid="dataset-contacts">
        <h3 class="mb-space-s text-base font-semibold text-highlighted">
          {{ $t("dataset.contacts") }}
        </h3>
        <ul class="flex flex-col gap-space-s">
          <li v-for="(contact, i) in contacts" :key="i">
            <DatasetContact :contact="contact" />
          </li>
        </ul>
      </section>
    </div>

    <section v-if="displayLinks.length">
      <h3 class="mb-2 text-base font-normal">
        {{ $t("dataset.links") }}
      </h3>
      <DatasetLinkList :links="displayLinks" />
    </section>

    <section v-if="serviceDistributions.length">
      <h3 class="mb-2 text-base font-normal">
        {{ $t("dataset.services") }}
      </h3>
      <DatasetServiceList :distributions="serviceDistributions" />
    </section>
  </div>
</template>
