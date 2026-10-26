<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({ key: "home", layout: "landing-page", keepalive: false });
useSeoMeta({ title: "SWISSGEO" });

const { t } = useI18n();
const localePath = useLocalePath();

const socialLinks = ref<NavigationMenuItem[]>([
  {
    label: "YouTube",
    icon: "i-lucide-youtube",
    to: "https://www.youtube.com/",
    target: "_blank",
  },
  {
    label: "Linkedin",
    icon: "i-lucide-linkedin",
    to: "https://www.linkedin.com/",
    target: "_blank",
  },
]);

const infosLinks = ref<NavigationMenuItem[]>([
  {
    label: "Nutzungsbestimmungen",
    to: "",
    trailingIcon: "i-lucide-arrow-right",
  },
  {
    label: "FAQ",
    to: "",
    trailingIcon: "i-lucide-arrow-right",
  },
]);
</script>

<template>
  <div class="relative h-full">
    <div id="hero" class="relative h-2/3 overflow-hidden">
      <img
        src="~/assets/images/hero.png"
        class="absolute h-full w-full translate-y-20 scale-200 object-cover lg:translate-y-0 lg:scale-100"
        alt=""
      />
      <div
        class="absolute inset-0 mx-4 flex cursor-pointer items-center justify-center lg:mx-8"
        @click="navigateTo(localePath('map'))"
      >
        <ClientOnly>
          <div
            id="search-bar"
            class="mx-auto w-(--ui-container) max-w-228 cursor-auto rounded-lg bg-primary-50 p-4 dark:bg-primary-800"
            @click.stop=""
          >
            <TopbarSearch
              class="w-full"
              @selected="navigateTo(localePath('map'))"
            />
          </div>
        </ClientOnly>
      </div>
    </div>
    <div
      class="mx-auto flex max-w-(--ui-container) flex-col gap-4 p-4 pb-16 lg:flex-row lg:p-8 lg:pb-16"
    >
      <UPageCard
        title="Karte"
        description="Interaktiver Karten-Viewer mit hunderten Ebenen, Zeitreise, Druck- und Teilen-Funktionen."
        icon="i-lucide-map"
        variant="outline"
        :ui="{
          root: 'h-72 lg:w-1/3',
          footer: 'ml-auto',
        }"
        :to="localePath('map')"
      >
        <template #footer>
          <UButton trailing-icon="i-lucide-arrow-right"> Zur Karte </UButton>
        </template>
      </UPageCard>
      <UPageCard
        title="Daten-Katalog"
        description="Durchsuchen Sie den vollständigen Katalog mit Geobasisdaten, Themen und Metadaten."
        icon="i-lucide-list-todo"
        variant="outline"
        :ui="{
          root: 'h-72 lg:w-1/3',
          footer: 'ml-auto',
        }"
        :to="localePath('map')"
      >
        <template #footer>
          <UButton trailing-icon="i-lucide-arrow-right">
            Daten-Katalog öffnen
          </UButton>
        </template>
      </UPageCard>
      <UPageCard
        title="Alles weitere um SWISSGEO"
        description="Alles zur News, Hilfe und Über uns."
        icon="i-lucide-app-window"
        to="https://info.swissgeo.ch"
        variant="soft"
        target="_blank"
        :ui="{
          root: 'h-72 lg:w-1/3 bg-primary-50 dark:bg-primary-800',
          footer: 'ml-auto',
        }"
      >
        <template #footer>
          <UButton trailing-icon="i-lucide-external-link">
            Zum Infoportal
          </UButton>
        </template>
      </UPageCard>
    </div>
    <UFooter
      :ui="{
        container:
          'bg-elevated max-w-full py-16 lg:py-16 px-4 lg:px-8 lg:justify-normal lg:grid lg:grid-cols-2',
        left: 'hidden',
        right: 'lg:justify-start lg:order-1',
        center: 'lg:order-2 lg:grid lg:grid-cols-3 lg:self-end lg:gap-8',
      }"
    >
      <template #right>
        <div
          class="mb-8 flex w-full flex-col gap-8 lg:mb-0 lg:grid lg:grid-cols-3 lg:items-end"
        >
          <div class="flex flex-col gap-4">
            <p class="text-2xl font-semibold">SWISSGEO<br />Das Wo ist hier.</p>
            <p class="text-sm font-medium">
              SWISSGEO macht raumbezogene Daten der Schweiz an einem Ort
              zugänglich.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-lg font-semibold">Folge uns!</p>
            <UNavigationMenu
              orientation="vertical"
              class="data-[orientation=vertical]:w-full"
              :items="socialLinks"
              :ui="{
                linkLabelExternalIcon: 'hidden',
              }"
            />
          </div>
        </div>
      </template>
      <div class="flex w-full flex-col gap-2">
        <p class="text-lg font-semibold">Weitere Informationen</p>
        <UNavigationMenu
          orientation="vertical"
          class="data-[orientation=vertical]:w-full"
          :items="infosLinks"
          :ui="{
            linkLabelExternalIcon: 'hidden',
          }"
        />
      </div>
    </UFooter>
    <div
      class="flex flex-col gap-4 bg-neutral-50 px-4 py-8 text-sm font-medium lg:flex-row-reverse lg:items-center lg:p-8 dark:bg-neutral-900"
    >
      <div
        class="text-accent grid grid-cols-2 grid-rows-2 gap-4 lg:flex lg:w-1/2 lg:flex-row"
      >
        <ULink target="_blank" raw class="text-left lg:w-fit">
          {{ t("footer.impressum") }}
        </ULink>
        <ULink target="_blank" raw class="text-left lg:w-fit">
          Rechtiches und Datenschutz
        </ULink>
        <ULink target="_blank" raw class="text-left lg:w-fit">
          Netiquette
        </ULink>
        <ULink target="_blank" raw class="text-left lg:w-fit">
          Barrierefreiheit
        </ULink>
      </div>
      <p class="lg:w-1/2">Copyright © 2026</p>
    </div>
  </div>
</template>
