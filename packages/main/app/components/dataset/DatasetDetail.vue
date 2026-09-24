<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";
import type {
  Dataset,
  DistributionCollection,
  Distribution,
  Link,
} from "@swissgeo/ogc";

import { resolveWebUrl } from "~/utils/resolveWebUrl";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import DatasetContact from "./DatasetContact.vue";
import DatasetLegend from "./DatasetLegend.vue";
import DatasetLinkList from "./DatasetLinkList.vue";
import DatasetServiceList from "./DatasetServiceList.vue";

const GEOCAT_HOSTNAMES = ["geocat.ch", "www.geocat.ch"];

const props = defineProps<{
  dataset: Dataset;
  distributionCollection: DistributionCollection | null;
}>();

const { t } = useI18n();
const tabs = computed<TabsItem[]>(() => [
  {
    label: t("dataset.overview"),
    value: "overview",
    slot: "overview",
  },
  { label: t("layers.legend.title"), value: "legend", slot: "legend" },
  {
    label: t("dataset.dataAccess"),
    value: "data-access",
    slot: "data-access",
  },
  {
    label: t("dataset.metadata"),
    value: "metadata",
    slot: "metadata",
  },
]);

const contacts = computed(() =>
  (props.dataset.properties.contacts ?? []).filter(
    (contact) =>
      contact.role === "pointOfContact" &&
      (contact.organization?.trim() || contact.country?.trim()),
  ),
);

const metadataLinks = computed<Link[]>(() => {
  return (props.dataset.links ?? []).filter((link) => {
    const href = resolveWebUrl(link.href);
    if (!href) {
      return false;
    }
    const { hostname } = new URL(href);
    return GEOCAT_HOSTNAMES.includes(hostname);
  });
});

const serviceDistributions = computed<Distribution[]>(() => {
  if (!props.distributionCollection?.features) {
    return [];
  }
  return props.distributionCollection.features.filter((distribution) => {
    const protocol = distribution.properties.protocol?.toLowerCase();
    return (
      distribution.properties.metaInformation !== true &&
      (protocol === "ogc:wms" ||
        protocol === "ogc:wmts" ||
        protocol === "ogcapi:stac")
    );
  });
});
</script>

<template>
  <UTabs
    :key="dataset.id"
    :items="tabs"
    default-value="overview"
    variant="link"
    color="neutral"
    :unmount-on-hide="false"
    :ui="{
      list: 'overflow-x-auto overflow-y-hidden px-0',
      trigger:
        'shrink-0 grow-0 px-2 text-primary data-[state=active]:text-highlighted',
      indicator: 'bottom-0',
    }"
    class="@container w-full gap-space-m"
  >
    <template #overview>
      <div
        v-if="dataset.properties.description || contacts.length"
        class="flex flex-col gap-space-m"
      >
        <section v-if="dataset.properties.description" class="max-w-prose">
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

        <section
          v-if="contacts.length"
          class="border-y border-default py-space-s"
          data-testid="dataset-contacts"
        >
          <h3
            class="mb-space-xs text-xs font-medium tracking-wide text-muted uppercase"
          >
            {{ $t("dataset.contacts") }}
          </h3>
          <ul class="flex flex-col gap-space-s">
            <li v-for="(contact, i) in contacts" :key="i">
              <DatasetContact :contact="contact" />
            </li>
          </ul>
        </section>
      </div>
    </template>

    <template #legend>
      <DatasetLegend
        :dataset="dataset"
        :distribution-collection="distributionCollection"
      />
    </template>

    <template #data-access>
      <section v-if="serviceDistributions.length">
        <h3 class="mb-space-m text-base font-semibold text-highlighted">
          {{ $t("dataset.dataAccess") }}
        </h3>
        <DatasetServiceList :distributions="serviceDistributions" />
      </section>
    </template>

    <template #metadata>
      <section v-if="metadataLinks.length">
        <h3 class="mb-space-m text-base font-semibold text-highlighted">
          {{ $t("dataset.metadata") }}
        </h3>
        <DatasetLinkList
          :links="metadataLinks"
          :label="$t('dataset.viewGeocat')"
        />
      </section>
    </template>
  </UTabs>
</template>
