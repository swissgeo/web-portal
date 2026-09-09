<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { LogoPic } from "@swissgeo/skeleton";

const { t } = useI18n();

const emit = defineEmits<{
  "reset-app": [void];
}>();

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
  <UHeader
    :ui="{
      container: 'max-w-full',
      center: 'lg:hidden xl:flex',
      toggle: 'lg:inline-flex xl:hidden',
      content: 'lg:flex xl:hidden',
    }"
    toggle-side="left"
  >
    <template #left>
      <LogoPic class="h-6 w-auto shrink-0" @logo-click="resetApp" />
      <!-- the search drives the map, so it cannot be server rendered; the
           fallback holds the field's place to avoid a layout shift -->
      <ClientOnly>
        <TopbarSearch />
        <template #fallback>
          <div class="h-8 w-72 grow rounded-md border border-default" />
        </template>
      </ClientOnly>
    </template>

    <UNavigationMenu
      :items="items"
      content-orientation="vertical"
      :ui="{
        content: 'w-fit',
      }"
    />

    <template #right>
      <div class="hidden items-center gap-1.5 xl:flex">
        <TopbarColorModeButton />
        <TopbarLanguageSwitcherButton />
      </div>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" />
      <div
        class="flex items-center justify-between border-t border-default pt-4"
      >
        <TopbarColorModeButton />
        <TopbarLanguageSwitcherButton />
      </div>
    </template>
  </UHeader>
</template>
