<script lang="ts" setup>
import type { Dataset } from "@swissgeo/ogc";

import { getShortTitle } from "@swissgeo/ogc";
import { useI18n } from "vue-i18n";

const { dataset } = defineProps<{
  dataset: Dataset;
}>();

const { t } = useI18n();
const isDesktop = useIsDesktop();
const localePath = useLocalePath();
const detailPath = computed(() => localePath(`/dataset/${dataset.id}`));
// On mobile the title opens the detail view, like the info button
const titlePath = computed(() =>
  isDesktop.value ? undefined : detailPath.value,
);

const { isOnMap, addToMap, removeFromMap } = useDatasetLayer(() => dataset);
const shortTitle = computed(() => getShortTitle(dataset.properties));

const provider = computed(() => {
  const contacts = dataset.properties.contacts ?? [];
  const provider = contacts.find(
    (contact) => contact.role === "resourceProvider",
  );
  if (provider) {
    return provider;
  } else if (contacts.length) {
    return contacts[0];
  }
});

const providerTitleText = computed(() => {
  if (!provider.value) {
    return;
  }
  const { role, organization } = provider.value;
  return role ? `${role}: ${organization}` : organization;
});

async function setOnMap(onMap: boolean): Promise<void> {
  if (onMap) {
    await addToMap();
  } else {
    removeFromMap();
  }
}
</script>

<template>
  <div
    role="row"
    class="hover:bg-accent-50 dark:hover:bg-accent-800 col-span-full grid grid-cols-subgrid border-b border-accented last:border-b-0"
    :class="isOnMap ? 'text-highlighted' : 'text-toned'"
  >
    <div
      role="cell"
      class="flex min-w-0 items-start px-2 py-4"
      :title="dataset.properties.title"
    >
      <USwitch
        data-testid="catalog-layer-on-map"
        size="xs"
        color="accent"
        checked-icon="i-lucide-check"
        :aria-label="shortTitle"
        :model-value="isOnMap"
        @update:model-value="setOnMap"
      />
      <ULink
        data-testid="catalog-layer-title"
        raw
        as="div"
        :to="titlePath"
        class="ms-4 min-w-0 text-sm"
      >
        <div class="flex min-w-0 items-center gap-space-xs">
          <p class="font-bold max-md:line-clamp-2 md:truncate">
            {{ shortTitle }}
          </p>
          <UBadge
            v-if="dataset.properties.aggregated"
            color="neutral"
            variant="subtle"
            size="sm"
            :label="t('dataset.aggregated')"
            class="shrink-0"
            data-testid="catalog-layer-aggregated"
          />
        </div>
        <!-- Replaces the data owner column on mobile -->
        <p
          v-if="provider"
          data-testid="catalog-layer-provider"
          class="line-clamp-2 font-medium md:hidden"
        >
          {{ provider.organization }}
        </p>
      </ULink>
    </div>
    <div
      role="cell"
      class="hidden truncate px-2 py-4 font-medium md:block"
      :title="providerTitleText"
    >
      {{ provider?.organization }}
    </div>
    <div role="cell" class="py-4 pr-2">
      <UButton
        data-testid="catalog-layer-info"
        icon="i-lucide-info"
        variant="link"
        color="accent"
        class="flex cursor-pointer p-0"
        :title="t('layers.info')"
        :aria-label="t('layers.info')"
        :to="detailPath"
      />
    </div>
  </div>
</template>
