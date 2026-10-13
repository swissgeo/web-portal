<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { LogoPic } from "@swissgeo/skeleton";
import { isEqual } from "es-toolkit";

const colorMode = useColorMode();
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
    label: t("topbar.map"),
    active: routeBaseName(route) === "map",
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
      body: 'lg:px-8',
    }"
    :toggle="{
      class: 'text-nav-brand',
    }"
    toggle-side="right"
  >
    <template #left>
      <ColorScheme>
        <LogoPic
          class="shrink-0"
          :darkMode="colorMode.value === 'dark'"
          @logo-click="resetApp"
        />
      </ColorScheme>
      <!-- the search drives the map, so it cannot be server rendered; the
           fallback holds the field's place to avoid a layout shift -->
      <ClientOnly>
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
      <UNavigationMenu :items="items" orientation="vertical" />
      <div
        class="flex items-center justify-between border-t border-default pt-4"
      >
        <TopbarLanguageSwitcherButton />
        <TopbarColorModeButton />
      </div>
    </template>
  </UHeader>
</template>
