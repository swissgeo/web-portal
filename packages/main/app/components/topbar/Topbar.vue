<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { LogoPic } from "@swissgeo/skeleton";
import { isEqual } from "es-toolkit";

const { displaySearchBar = true } = defineProps<{
  displaySearchBar?: boolean;
}>();

const colorMode = useColorMode();
const { t } = useI18n();
const route = useRoute();
const routeBaseName = useRouteBaseName();
const localePath = useLocalePath();
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
    active: routeBaseName(route) === "index",
    to: { path: localePath("/") },
  },
  {
    label: t("topbar.map"),
    active: routeBaseName(route) === "map",
    to: { path: localePath("/map") },
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
      container:
        'max-w-full gap-1.5 xl:gap-10 bg-primary-50 dark:bg-primary-800',
      left: 'justify-between flex gap-10 grow xl:grow-0 xl:flex-none',
      right: 'lg:flex-none xl:flex-none xl:flex xl:ml-auto',
      center: 'lg:hidden xl:flex',
      toggle: 'lg:inline-flex xl:hidden',
      content: 'lg:flex xl:hidden',
      header: 'lg:px-8 gap-1.5',
      body: 'lg:px-8 px-8 py-4',
    }"
    :toggle="{
      class: 'text-nav-brand',
    }"
    toggle-side="right"
  >
    <template #left>
      <ClientOnly>
        <LogoPic
          class="shrink-0"
          :darkMode="colorMode.value === 'dark'"
          @logo-click="resetApp"
        />
        <template #fallback>
          <div class="h-8 w-32.75 shrink-0" />
        </template>
      </ClientOnly>
      <!-- the search drives the map, so it cannot be server rendered; the
           fallback holds the field's place to avoid a layout shift -->
      <ClientOnly v-if="displaySearchBar">
        <TopbarSearch />
        <template #fallback>
          <div class="h-8 w-119.25 grow" />
        </template>
      </ClientOnly>
    </template>

    <UNavigationMenu
      :items="items"
      content-orientation="vertical"
      :ui="{
        content: 'w-fit',
        list: 'gap-1.5',
        link: 'text-nav-brand hover:before:bg-nav-brand-shade hover:text-nav-brand-hover data-active:before:bg-inverted data-active:text-inverted',
      }"
    />

    <template #right>
      <div class="hidden items-center gap-1.5 xl:flex">
        <TopbarLanguageSwitcherButton />
        <TopbarColorModeButton />
      </div>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        :ui="{
          item: 'mb-4',
          link: 'text-lg text-accent data-active:before:bg-elevated data-active:text-accent-active',
        }"
      />
      <div class="flex items-center border-y border-default py-4">
        <div class="w-full">
          <TopbarLanguageSwitcherButton size="xl" />
        </div>
        <div class="w-full">
          <TopbarColorModeButton size="xl" class="w-fit" />
        </div>
      </div>
    </template>
  </UHeader>
</template>
