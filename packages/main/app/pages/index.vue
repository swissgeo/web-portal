<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { useSidebarStore, SidebarType } from "@swissgeo/skeleton";
import { joinURL } from "ufo";

definePageMeta({ key: "home", layout: "landing-page" });
useSeoMeta({ title: "SWISSGEO" });

const { t, locale } = useI18n();
const localePath = useLocalePath();
const runtimeConfig = useRuntimeConfig();
const uiStore = useSidebarStore();

function cmsUrl(path: string): string {
  return joinURL(runtimeConfig.public.cmsBaseUrl, locale.value, path);
}

const socialLinks = ref<NavigationMenuItem[]>([
  {
    label: "YouTube",
    icon: "i-lucide-youtube",
    to: "https://www.youtube.com/@SWISSGEOplatform",
    target: "_blank",
  },
  {
    label: "Linkedin",
    icon: "i-lucide-linkedin",
    to: "https://www.linkedin.com/company/swissgeo/",
    target: "_blank",
  },
]);

const infosLinks = computed<NavigationMenuItem[]>(() => [
  {
    label: t("landing.footer.termsOfUse"),
    to: cmsUrl(t("landing.links.termsOfUse")),
    trailingIcon: "i-lucide-arrow-right",
  },
  {
    label: t("landing.footer.contact"),
    to: cmsUrl(t("landing.links.contact")),
    trailingIcon: "i-lucide-arrow-right",
  },
]);

const infoPortalUrl = computed(() => cmsUrl(locale.value));

async function goToMap(openGeoCatalogTree = false): Promise<void> {
  if (openGeoCatalogTree) {
    uiStore.setSidebar(SidebarType.GEOCATALOG_TREE);
  }
  await navigateTo(localePath("map"));
}
</script>

<template>
  <div class="relative h-full">
    <div id="hero" class="relative h-2/3 overflow-hidden">
      <img
        src="/images/hero.png"
        class="absolute h-full w-full translate-y-20 scale-200 object-cover lg:translate-y-0 lg:scale-100"
        alt=""
      />
      <div
        class="absolute inset-0 mx-4 flex cursor-pointer items-center justify-center lg:mx-8"
        @click="goToMap()"
      >
        <ClientOnly>
          <div
            id="search-bar"
            class="mx-auto w-(--ui-container) max-w-228 cursor-auto rounded-lg bg-primary-50 p-4 dark:bg-primary-800"
            @click.stop=""
          >
            <TopbarSearch
              class="w-full"
              :skip-mobile="true"
              @selected="goToMap()"
            />
          </div>
        </ClientOnly>
      </div>
    </div>
    <div
      class="mx-auto flex max-w-(--ui-container) flex-col gap-4 p-4 pb-16 lg:flex-row lg:p-8 lg:pb-16"
    >
      <UPageCard
        :title="t('landing.cards.map.title')"
        :description="t('landing.cards.map.description')"
        icon="i-lucide-map"
        variant="outline"
        :ui="{
          root: 'h-72 lg:w-1/3 cursor-pointer',
          footer: 'ml-auto',
        }"
        @click="goToMap()"
      >
        <template #footer>
          <UButton trailing-icon="i-lucide-arrow-right">
            {{ t("landing.cards.map.button") }}
          </UButton>
        </template>
      </UPageCard>
      <UPageCard
        :title="t('landing.cards.catalog.title')"
        :description="t('landing.cards.catalog.description')"
        icon="i-lucide-list-todo"
        variant="outline"
        :ui="{
          root: 'h-72 lg:w-1/3 cursor-pointer',
          footer: 'ml-auto',
        }"
        @click="goToMap(true)"
      >
        <template #footer>
          <UButton trailing-icon="i-lucide-arrow-right">
            {{ t("landing.cards.catalog.button") }}
          </UButton>
        </template>
      </UPageCard>
      <UPageCard
        :title="t('landing.cards.info.title')"
        :description="t('landing.cards.info.description')"
        icon="i-lucide-app-window"
        :to="infoPortalUrl"
        variant="soft"
        target="_blank"
        :ui="{
          root: 'h-72 lg:w-1/3 bg-primary-50 dark:bg-primary-800',
          footer: 'ml-auto',
        }"
      >
        <template #footer>
          <UButton trailing-icon="i-lucide-external-link">
            {{ t("landing.cards.info.button") }}
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
            <p class="text-2xl font-semibold">
              SWISSGEO<br />{{ t("landing.footer.claim") }}
            </p>
            <p class="text-sm font-medium">
              {{ t("landing.footer.description") }}
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-lg font-semibold">
              {{ t("landing.footer.followUs") }}
            </p>
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
        <p class="text-lg font-semibold">
          {{ t("landing.footer.moreInformation") }}
        </p>
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
        <ULink
          :to="cmsUrl(t('landing.links.impressum'))"
          target="_blank"
          raw
          class="text-left lg:w-fit"
        >
          {{ t("footer.impressum") }}
        </ULink>
        <ULink
          :to="cmsUrl(t('landing.links.dataProtection'))"
          target="_blank"
          raw
          class="text-left lg:w-fit"
        >
          {{ t("landing.footer.dataProtection") }}
        </ULink>
        <ULink
          :to="cmsUrl(t('landing.links.netiquette'))"
          target="_blank"
          raw
          class="text-left lg:w-fit"
        >
          {{ t("landing.footer.netiquette") }}
        </ULink>
        <ULink
          :to="cmsUrl(t('landing.links.accessibility'))"
          target="_blank"
          raw
          class="text-left lg:w-fit"
        >
          {{ t("landing.footer.accessibility") }}
        </ULink>
      </div>
      <p class="lg:w-1/2">{{ t("landing.footer.copyright") }}</p>
    </div>
  </div>
</template>
