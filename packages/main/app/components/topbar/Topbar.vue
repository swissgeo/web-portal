<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { SearchResult } from "@swissgeo/search";

import { LogoPic } from "@swissgeo/skeleton";

const emit = defineEmits<{
  "reset-app": [void];
  "search-result-selected": [result: SearchResult];
}>();

const localePath = useLocalePath();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Startseite",
  },
  {
    label: "Geodaten und Karten",
    children: [
      {
        label: "Wie kann ich Geodaten nutzen?",
      },
      {
        label: "Geodaten im Kartenviewer anschauen",
      },
      {
        label: "Themen und Daten entdecken",
      },
      {
        label: "Geodienste: Daten beziehen und einbinden",
      },
      {
        label: "Geodaten suchen",
      },
      {
        label: "Neue Daten und Updates",
      },
    ],
  },
  {
    label: "Tutorials und Hilfe",
    children: [
      {
        label: "Erste Schritte im Kartenviewer",
      },
      {
        label: "Navigation im Kartenviewer",
      },
      {
        label: "Metadatenkatalog",
      },
      {
        label: "Weitere Funktionen",
      },
    ],
  },
  {
    label: "Fachinformationen",
    children: [
      {
        label: "Nationale Geodaten-Infrastruktur (NGDI)",
      },
      {
        label: "Geobasisdaten, Geodatenmodelle und Standards",
      },
      {
        label: "Katalog der geografischen Metadaten der Schweiz",
      },
      {
        label: "Filme über Geoinformationen",
      },
    ],
  },
  {
    label: "Über uns",
    children: [
      {
        label: "Was ist SWISSGEO?",
      },
      {
        label: "Vision",
      },
      {
        label: "Strategie Geoinformation Schweiz",
      },
      {
        label: "Kennzahlen",
      },
      {
        label: "Organisation",
      },
      {
        label: "Rechtliche Grundlagen",
      },
      {
        label: "Medieninformationen",
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
      <UButton :to="localePath('/map')"> Karte </UButton>
      <USeparator class="mx-4 h-8" orientation="vertical" />
      <UButton icon="i-lucide-log-in" color="neutral" variant="outline"
        >Anmelden</UButton
      >
      <TopbarLanguageSwitcherButton />
    </template>
  </UHeader>
</template>
