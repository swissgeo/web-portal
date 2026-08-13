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
    label: t("topbar.map"),
    to: localePath("/map"),
    ui: {
      link: "aria-[current=page]:text-primary aria-[current=page]:before:bg-primary/10",
    },
  },
  {
    label: t("topbar.services"),
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

function resetApp() {
  emit("reset-app");
}
</script>

<template>
  <UHeader
    :ui="{
      root: 'bg-default backdrop-blur-none',
      container: 'max-w-none gap-0 px-[15px] lg:px-8',
      left: 'shrink-0 gap-0 2xl:flex-none 2xl:pe-5',
      center: 'lg:hidden 2xl:flex 2xl:flex-1 2xl:items-center 2xl:gap-10',
      right: 'shrink-0 gap-1.5 2xl:flex-none 2xl:gap-10',
      content: 'lg:block 2xl:hidden',
      overlay: 'lg:block 2xl:hidden',
      body: 'flex flex-col gap-6',
    }"
  >
    <template #left>
      <LogoPic
        bare
        class="flex h-8 w-[122.4px] items-center focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary 2xl:w-[209.896px]"
        aria-label="SWISSGEO"
        data-testid="topbar-logo"
        @logo-click="resetApp"
      />
    </template>

    <TopbarSearch @result-selected="emit('search-result-selected', $event)" />

    <UNavigationMenu
      :items="items"
      content-orientation="vertical"
      :ui="{
        root: 'shrink-0',
        link: 'font-sans text-muted hover:text-primary hover:before:bg-primary/10',
        linkLabel: 'whitespace-nowrap',
        content: 'w-fit',
      }"
    />

    <template #right>
      <div class="hidden w-24 justify-center 2xl:flex">
        <TopbarColorModeButton />
      </div>
      <UButton
        icon="i-lucide-log-in"
        color="neutral"
        variant="ghost"
        size="sm"
        class="hidden text-primary hover:bg-primary/10 hover:text-primary 2xl:inline-flex"
      >
        {{ t("topbar.login") }}
      </UButton>
      <div class="hidden 2xl:block">
        <TopbarLanguageSwitcherButton />
      </div>
    </template>

    <template #toggle="{ open, toggle }">
      <div class="flex items-center gap-1.5 2xl:hidden">
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="t('search.placeholder')"
          @click="toggle"
        />
        <UButton
          :icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-label="open ? 'Menü schliessen' : 'Menü öffnen'"
          @click="toggle"
        />
      </div>
    </template>

    <template #body>
      <TopbarSearch @result-selected="emit('search-result-selected', $event)" />
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        :ui="{
          link: 'font-sans text-muted hover:text-primary hover:before:bg-primary/10',
        }"
      />
      <div
        class="flex items-center justify-between border-t border-default pt-4"
      >
        <TopbarColorModeButton />
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-log-in"
            color="neutral"
            variant="ghost"
            size="sm"
            class="text-primary hover:bg-primary/10 hover:text-primary"
          >
            {{ t("topbar.login") }}
          </UButton>
          <TopbarLanguageSwitcherButton />
        </div>
      </div>
    </template>
  </UHeader>
</template>
