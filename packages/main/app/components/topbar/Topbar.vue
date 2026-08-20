<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { SearchResult } from "@swissgeo/search";

import { LogoPic } from "@swissgeo/skeleton";

const { t } = useI18n();

const emit = defineEmits<{
  "reset-app": [void];
  "search-result-selected": [result: SearchResult];
}>();

const localePath = useLocalePath();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t("topbar.home"),
  },
  {
    label: t("topbar.geoDataAndMaps"),
    children: [
      {
        label: t("topbar.howToUseGeodata"),
      },
      {
        label: t("topbar.viewGeodataInMapViewer"),
      },
      {
        label: t("topbar.discoverTopicsAndData"),
      },
      {
        label: t("topbar.geoservices"),
      },
      {
        label: t("topbar.searchGeodata"),
      },
      {
        label: t("topbar.newDataAndUpdates"),
      },
    ],
  },
  {
    label: t("topbar.tutorialsAndHelp"),
    children: [
      {
        label: t("topbar.gettingStarted"),
      },
      {
        label: t("topbar.mapViewerNavigation"),
      },
      {
        label: t("topbar.metadataCatalog"),
      },
      {
        label: t("topbar.moreFeatures"),
      },
    ],
  },
  {
    label: t("topbar.specialistInfo"),
    children: [
      {
        label: t("topbar.ngdi"),
      },
      {
        label: t("topbar.geobaseData"),
      },
      {
        label: t("topbar.metadataCatalogSwitzerland"),
      },
      {
        label: t("topbar.geoInformationFilms"),
      },
    ],
  },
  {
    label: t("topbar.aboutUs"),
    children: [
      {
        label: t("topbar.whatIsSwissgeo"),
      },
      {
        label: t("topbar.vision"),
      },
      {
        label: t("topbar.strategy"),
      },
      {
        label: t("topbar.keyFigures"),
      },
      {
        label: t("topbar.organisation"),
      },
      {
        label: t("topbar.legalBasis"),
      },
      {
        label: t("topbar.mediaInformation"),
      },
    ],
  },
]);

function resetApp() {
  emit("reset-app");
}
</script>

<template>
  <UHeader :ui="{ container: 'max-w-full' }">
    <template #left>
      <LogoPic class="h-6 w-auto" @logo-click="resetApp" />
      <TopbarSearch @result-selected="emit('search-result-selected', $event)" />
    </template>

    <template #right>
      <UNavigationMenu
        :items="items"
        content-orientation="vertical"
        :ui="{
          content: 'w-fit',
        }"
      />
      <UButton :to="localePath('/map')"> {{ t("topbar.map") }} </UButton>
      <USeparator class="mx-4 h-8" orientation="vertical" />
      <UButton
        icon="i-lucide-log-in"
        color="neutral"
        variant="outline"
        class="whitespace-nowrap"
        >{{ t("topbar.login") }}</UButton
      >
      <TopbarLanguageSwitcherButton />
    </template>
  </UHeader>
</template>
