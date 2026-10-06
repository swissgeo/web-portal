<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { LogoPic } from "@swissgeo/skeleton";
import { isEqual } from "es-toolkit";

const { t } = useI18n();
const route = useRoute();
const routeBaseName = useRouteBaseName();
const menuOpen = ref(false);

// Language changes translate the open menu without closing it.
watch(
  () => ({
    name: routeBaseName(route) ?? route.path,
    params: route.params,
    query: route.query,
    hash: route.hash,
  }),
  (destination, previous) => {
    if (!isEqual(destination, previous)) {
      menuOpen.value = false;
    }
  },
);

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
  <!-- UHeader switches to its mobile layout below lg and has no prop to change
       that; most of the ui classes below move the switch to xl by undoing the
       default lg: rules and re-applying them at xl: -->
  <UHeader
    v-model:open="menuOpen"
    :auto-close="false"
    :ui="{
      container: 'max-w-full gap-8',
      left: 'min-w-0 gap-4 flex-1',
      right: 'hidden xl:flex-none xl:flex',
      center: 'lg:hidden xl:flex',
      toggle: 'lg:inline-flex xl:hidden',
      content: 'lg:flex xl:hidden',
      header: 'lg:px-8',
      body: 'lg:px-8',
    }"
    toggle-side="left"
  >
    <template #left>
      <LogoPic class="shrink-0" @logo-click="resetApp" />
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
