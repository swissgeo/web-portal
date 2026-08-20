<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { SearchResult } from "@swissgeo/search";

import { LogoPic } from "@swissgeo/skeleton";

const { t } = useI18n();
const route = useRoute();
const isDarkHeader = computed(() => route.meta.headerVariant === "dark");

const emit = defineEmits<{
  "search-result-selected": [result: SearchResult];
}>();

const localePath = useLocalePath();
const homePath = computed(() => localePath("/home"));
const mapPath = computed(() => localePath("/map"));
const servicesPath = computed(() => localePath("/services"));

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t("topbar.home"),
    to: homePath.value,
  },
  {
    label: t("topbar.map"),
    to: mapPath.value,
    ui: {
      link: "aria-[current=page]:text-primary aria-[current=page]:before:bg-primary/10",
    },
  },
  {
    label: t("topbar.services"),
    to: servicesPath.value,
  },
  {
    label: t("topbar.fundamentalsAndStandards"),
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

function goToMap() {
  void navigateTo(mapPath.value);
}
</script>

<template>
  <UHeader
    :ui="{
      root: isDarkHeader
        ? 'border-petrol-900 bg-petrol-800 backdrop-blur-none'
        : 'bg-default backdrop-blur-none',
      container: 'max-w-none gap-0 px-[15px] lg:px-8',
      left: 'shrink-0 gap-0 xl:flex-none xl:pe-4 2xl:pe-5',
      center:
        'lg:hidden xl:flex xl:min-w-0 xl:flex-1 xl:items-center xl:gap-4 2xl:gap-10',
      right: 'shrink-0 gap-1.5 xl:flex-none xl:gap-4 2xl:gap-10',
      content: 'lg:block xl:hidden',
      overlay: 'lg:block xl:hidden',
      body: 'flex flex-col gap-6',
    }"
  >
    <template #left>
      <LogoPic
        bare
        class="flex h-8 w-[122.4px] items-center focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary 2xl:w-[209.896px]"
        :negative="isDarkHeader"
        aria-label="SWISSGEO"
        data-testid="topbar-logo"
        @logo-click="goToMap"
      />
    </template>

    <TopbarSearch
      :inverted="isDarkHeader"
      @result-selected="emit('search-result-selected', $event)"
    />

    <UNavigationMenu
      :items="items"
      content-orientation="vertical"
      :ui="{
        root: 'shrink-0',
        link: isDarkHeader
          ? 'font-sans text-petrol-100 hover:text-white hover:before:bg-petrol-700 aria-[current=page]:text-white aria-[current=page]:before:bg-petrol-700'
          : 'font-sans text-muted hover:text-primary hover:before:bg-primary/10',
        linkLabel: 'whitespace-nowrap',
        content: 'w-fit',
      }"
    />

    <template #right>
      <div v-if="!isDarkHeader" class="hidden w-24 justify-center xl:flex">
        <TopbarColorModeButton />
      </div>
      <UButton
        icon="i-lucide-log-in"
        color="primary"
        variant="ghost"
        size="md"
        class="hidden xl:inline-flex"
        :class="
          isDarkHeader
            ? 'text-petrol-100 hover:bg-petrol-700 hover:text-white'
            : undefined
        "
      >
        {{ t("topbar.login") }}
      </UButton>
      <div class="hidden xl:block">
        <TopbarLanguageSwitcherButton :inverted="isDarkHeader" />
      </div>
    </template>

    <template #toggle="{ open, toggle }">
      <div class="flex items-center gap-1.5 xl:hidden">
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="t('search.placeholder')"
          :class="
            isDarkHeader
              ? 'text-petrol-100 hover:bg-petrol-700 hover:text-white'
              : undefined
          "
          @click="toggle"
        />
        <UButton
          :icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="open ? 'Menü schliessen' : 'Menü öffnen'"
          :class="
            isDarkHeader
              ? 'text-petrol-100 hover:bg-petrol-700 hover:text-white'
              : undefined
          "
          @click="toggle"
        />
      </div>
    </template>

    <template #body>
      <TopbarSearch
        :inverted="isDarkHeader"
        @result-selected="emit('search-result-selected', $event)"
      />
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        :ui="{
          link: isDarkHeader
            ? 'font-sans text-petrol-100 hover:text-white hover:before:bg-petrol-700'
            : 'font-sans text-muted hover:text-primary hover:before:bg-primary/10',
        }"
      />
      <div
        class="flex items-center justify-between border-t border-default pt-4"
      >
        <TopbarColorModeButton v-if="!isDarkHeader" />
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-log-in"
            color="primary"
            variant="ghost"
            size="md"
          >
            {{ t("topbar.login") }}
          </UButton>
          <TopbarLanguageSwitcherButton :inverted="isDarkHeader" />
        </div>
      </div>
    </template>
  </UHeader>
</template>
