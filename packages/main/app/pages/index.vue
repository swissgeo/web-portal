<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { useSidebarStore, SidebarType } from "@swissgeo/skeleton";

definePageMeta({ key: "home", layout: "landing-page" });
useSeoMeta({ title: "SWISSGEO" });

const { t } = useI18n();
const localePath = useLocalePath();
const uiStore = useSidebarStore();
const { cmsUrl } = useCmsUrl();

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
    target: "_blank",
    trailingIcon: "i-lucide-arrow-right",
  },
  {
    label: t("landing.footer.contact"),
    to: cmsUrl(t("landing.links.contact")),
    target: "_blank",
    trailingIcon: "i-lucide-arrow-right",
  },
]);

const infoPortalUrl = computed(() => cmsUrl());

async function goToMap(openGeoCatalogTree = false): Promise<void> {
  if (openGeoCatalogTree) {
    uiStore.setSidebar(SidebarType.GEOCATALOG_TREE);
  }
  await navigateTo(localePath("map"));
}
</script>

<template>
  <div class="relative h-full">
    <div id="hero" class="relative h-9/10 overflow-hidden">
      <img
        src="/images/hero.webp"
        class="absolute h-full w-full translate-y-20 scale-200 object-cover brightness-38 lg:translate-y-0 lg:scale-100"
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
              @coordinates-detected="goToMap()"
            />
          </div>
        </ClientOnly>
      </div>
    </div>
    <div
      class="mx-auto flex max-w-(--ui-container) flex-col gap-8 p-4 pb-16 lg:flex-row lg:p-8 lg:pb-16"
    >
      <UPageCard
        :title="t('landing.cards.map.title')"
        :description="t('landing.cards.map.description')"
        icon="i-lucide-map"
        variant="outline"
        :ui="{
          root: 'lg:w-1/3 cursor-pointer',
          footer: 'ml-auto',
          title: 'text-xl',
          description: 'text-base font-medium text-default',
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
          root: 'lg:w-1/3 cursor-pointer',
          footer: 'ml-auto',
          title: 'text-xl',
          description: 'text-base font-medium text-default',
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
          root: 'lg:w-1/3 bg-primary-50 dark:bg-primary-800',
          footer: 'ml-auto',
          title: 'text-xl',
          description: 'text-base font-medium text-default',
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
          'bg-elevated max-w-full py-16 lg:py-16 px-4 lg:px-8 lg:justify-normal lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto]',
        left: 'hidden',
        right:
          'flex-col lg:items-start lg:justify-start lg:order-1 lg:row-span-2 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:grid-rows-subgrid',
        center:
          'flex-col lg:items-start lg:order-2 lg:row-span-2 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:grid-rows-subgrid',
      }"
    >
      <template #right>
        <p
          class="w-full text-2xl font-semibold lg:col-start-1 lg:row-start-1 lg:self-end"
        >
          SWISSGEO<br />{{ t("landing.footer.claim") }}
        </p>
        <p
          class="mt-4 w-full text-sm font-medium lg:col-start-1 lg:row-start-2"
        >
          {{ t("landing.footer.description") }}
        </p>
        <p
          class="mt-8 w-full text-lg font-semibold lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-end"
        >
          {{ t("landing.footer.followUs") }}
        </p>
        <UNavigationMenu
          orientation="vertical"
          class="mt-2 mb-8 data-[orientation=vertical]:w-full lg:col-start-2 lg:row-start-2 lg:mb-0"
          :items="socialLinks"
          :ui="{
            linkLabelExternalIcon: 'hidden',
            link: 'text-accent hover:text-accent-hover',
            linkLeadingIcon: 'text-accent hover:text-accent-hover',
          }"
        />
      </template>
      <p class="w-full text-lg font-semibold lg:row-start-1 lg:self-end">
        {{ t("landing.footer.moreInformation") }}
      </p>
      <UNavigationMenu
        orientation="vertical"
        class="mt-2 data-[orientation=vertical]:w-full lg:row-start-2"
        :items="infosLinks"
        :ui="{
          linkLabelExternalIcon: 'hidden',
          link: 'text-accent hover:text-accent-hover',
          linkLeadingIcon: 'text-accent hover:text-accent-hover',
        }"
      />
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
          class="text-left hover:text-accent-hover lg:w-fit"
        >
          {{ t("footer.impressum") }}
        </ULink>
        <ULink
          :to="cmsUrl(t('landing.links.dataProtection'))"
          target="_blank"
          raw
          class="text-left hover:text-accent-hover lg:w-fit"
        >
          {{ t("landing.footer.dataProtection") }}
        </ULink>
        <ULink
          :to="cmsUrl(t('landing.links.netiquette'))"
          target="_blank"
          raw
          class="text-left hover:text-accent-hover lg:w-fit"
        >
          {{ t("landing.footer.netiquette") }}
        </ULink>
        <ULink
          :to="cmsUrl(t('landing.links.accessibility'))"
          target="_blank"
          raw
          class="text-left hover:text-accent-hover lg:w-fit"
        >
          {{ t("landing.footer.accessibility") }}
        </ULink>
      </div>
      <p class="lg:w-1/2">{{ t("landing.footer.copyright") }}</p>
    </div>
  </div>
</template>
