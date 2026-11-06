<script lang="ts" setup>
import type { TabsItem } from "@nuxt/ui";
import type {
  Dataset,
  DistributionCollection,
  Distribution,
  Link,
} from "@swissgeo/ogc";
import type { DatasetTab } from "~/utils/datasetTab";

import ErrorPill from "~/components/ErrorPill.vue";
import { DEFAULT_DATASET_TAB } from "~/utils/datasetTab";
import { determineFormat } from "~/utils/determineFormat";
import { resolveWebUrl } from "~/utils/resolveWebUrl";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import DatasetContact from "./DatasetContact.vue";
import DatasetDescription from "./DatasetDescription.vue";
import DatasetLegend from "./DatasetLegend.vue";
import DatasetLinkList from "./DatasetLinkList.vue";
import DatasetServiceList from "./DatasetServiceList.vue";

const GEOCAT_HOSTNAMES = ["geocat.ch", "www.geocat.ch"];

const props = defineProps<{
  dataset: Dataset;
  distributionCollection: DistributionCollection | null;
  distributionError?: boolean;
}>();

// The parent keeps the open tab, because a language switch unmounts this component.
const tab = defineModel<DatasetTab>("tab", { default: DEFAULT_DATASET_TAB });

const { t } = useI18n();
// The tab list stays above the panel's scroll area together with the header,
// so the scrollbar only runs along the tab content.
const panelFixed = usePanelFixed();
// The tab values must match DATASET_TABS, because the URL selects the tab.
const tabs = computed<(TabsItem & { value: DatasetTab })[]>(() => [
  { label: t("dataset.overview"), value: "overview" },
  { label: t("layers.legend.title"), value: "legend" },
  { label: t("dataset.dataAccess"), value: "data-access" },
  { label: t("dataset.metadata"), value: "metadata" },
]);

const contacts = computed(() =>
  (props.dataset.properties.contacts ?? []).filter(
    (contact) =>
      contact.roles?.includes("pointOfContact") &&
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
    return (
      distribution.properties.metaInformation !== true &&
      determineFormat(distribution) !== null
    );
  });
});
</script>

<template>
  <div :key="dataset.id" class="w-full">
    <Teleport :to="panelFixed" :disabled="!panelFixed">
      <UTabs
        v-model="tab"
        :items="tabs"
        variant="link"
        color="neutral"
        :content="false"
        :ui="{
          list: 'overflow-x-auto overflow-y-hidden bg-default p-0 px-4 lg:px-8',
          trigger:
            'shrink-0 grow-0 px-2 pt-1 pb-2 leading-small-text data-[state=active]:text-highlighted data-[state=inactive]:text-primary dark:data-[state=inactive]:text-petrol-300',
          indicator: 'bottom-0',
        }"
        class="w-full"
      />
    </Teleport>
    <!-- The panels stay mounted, so each tab keeps its state while hidden. -->
    <div class="@container w-full pt-4 lg:pt-8">
      <section
        :hidden="tab !== 'overview'"
        role="tabpanel"
        :data-state="tab === 'overview' ? 'active' : 'inactive'"
        :aria-label="t('dataset.overview')"
        tabindex="0"
      >
        <div
          v-if="dataset.properties.description || contacts.length"
          class="flex flex-col gap-space-m"
        >
          <section
            v-if="dataset.properties.description"
            class="max-w-[37.3125rem]"
          >
            <h3 class="mb-4 text-base font-semibold text-highlighted">
              {{ t("dataset.abstract") }}
            </h3>
            <DatasetDescription
              :key="dataset.id"
              :description="dataset.properties.description"
            />
          </section>

          <section
            v-if="contacts.length"
            class="border-y border-default py-space-s"
            data-testid="dataset-contacts"
          >
            <h3
              class="mb-space-xs text-xs font-medium tracking-wide text-muted uppercase"
            >
              {{ t("dataset.contact") }}
            </h3>
            <ul class="flex flex-col gap-space-s">
              <li v-for="(contact, i) in contacts" :key="i">
                <DatasetContact :contact="contact" />
              </li>
            </ul>
          </section>
        </div>
      </section>

      <section
        :hidden="tab !== 'legend'"
        role="tabpanel"
        :data-state="tab === 'legend' ? 'active' : 'inactive'"
        :aria-label="t('layers.legend.title')"
        tabindex="0"
      >
        <h3
          class="mb-4 text-lg font-semibold text-highlighted lg:mb-8 lg:text-xl"
        >
          {{ t("layers.legend.title") }}
        </h3>
        <ErrorPill v-if="distributionError">
          {{ t("dataset.legendError") }}
        </ErrorPill>
        <DatasetLegend
          v-else
          :dataset="dataset"
          :distribution-collection="distributionCollection"
        />
      </section>

      <section
        :hidden="tab !== 'data-access'"
        role="tabpanel"
        :data-state="tab === 'data-access' ? 'active' : 'inactive'"
        :aria-label="t('dataset.dataAccess')"
        tabindex="0"
      >
        <div v-if="distributionError || serviceDistributions.length">
          <h3
            class="mb-4 text-lg font-semibold text-highlighted lg:mb-8 lg:text-xl"
          >
            {{ t("dataset.dataAccess") }}
          </h3>
          <ErrorPill v-if="distributionError">
            {{ t("error.generic") }}
          </ErrorPill>
          <DatasetServiceList v-else :distributions="serviceDistributions" />
        </div>
      </section>

      <section
        :hidden="tab !== 'metadata'"
        role="tabpanel"
        :data-state="tab === 'metadata' ? 'active' : 'inactive'"
        :aria-label="t('dataset.metadata')"
        tabindex="0"
      >
        <div v-if="metadataLinks.length">
          <h3
            class="mb-4 text-lg font-semibold text-highlighted lg:mb-8 lg:text-xl"
          >
            {{ t("dataset.metadata") }}
          </h3>
          <DatasetLinkList
            :links="metadataLinks"
            :label="t('dataset.viewGeocat')"
            :tooltip="t('dataset.openService')"
          />
        </div>
      </section>
    </div>
  </div>
</template>
