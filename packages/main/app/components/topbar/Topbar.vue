<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { LogoPic } from "@swissgeo/skeleton";

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
</script>

<template>
  <UHeader :ui="{ container: 'max-w-full' }">
    <template #left>
      <LogoPic class="h-6 w-auto" />
      <UInput
        icon="i-lucide-search"
        size="md"
        variant="outline"
        placeholder="Search..."
      />
    </template>

    <template #right>
      <UNavigationMenu :items="items" content-orientation="vertical" />
      <UButton to="/map"> Karte </UButton>
    </template>
  </UHeader>
</template>
