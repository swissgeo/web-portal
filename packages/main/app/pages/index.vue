<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { useSidebarStore, SidebarType } from "@swissgeo/skeleton";

definePageMeta({ key: "home", layout: "landing-page" });
useSeoMeta({ title: "SWISSGEO" });

const { t } = useI18n();
const localePath = useLocalePath();
const uiStore = useSidebarStore();
const { cmsUrl } = useCmsUrl();
const { reportIssuePortalUrl } = useRuntimeConfig().public;

const socialLinks = ref<NavigationMenuItem[]>([
  {
    label: "YouTube",
    icon: "i-lucide-youtube",
    to: "https://www.youtube.com/@SWISSGEOplatform",
    target: "_blank",
  },
  {
    label: "LinkedIn",
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

const cardUi = {
  root: "rounded-[calc(var(--ui-radius)*2.5)] lg:w-1/3",
  container: "p-6",
  leading: "mb-2",
  title: "text-xl leading-small-text",
  description: "mt-2 text-base leading-small-text font-medium text-default",
  footer: "ml-auto pt-8",
};
const outlineCardUi = {
  ...cardUi,
  root: `${cardUi.root} cursor-pointer hover:bg-elevated hover:ring-0`,
};

async function goToMap(openGeoCatalogTree = false): Promise<void> {
  if (openGeoCatalogTree) {
    uiStore.setSidebar(SidebarType.GEOCATALOG_TREE);
  }
  await navigateTo(localePath("map"));
}
</script>

<template>
  <div class="relative h-full">
    <div id="hero" class="relative h-9/10 overflow-hidden lg:h-[42.4375rem]">
      <img
        src="/images/hero.webp"
        class="absolute h-full w-full translate-y-20 scale-200 object-cover brightness-38 lg:translate-y-0 lg:scale-100"
        alt=""
      />
      <div
        class="absolute inset-0 mx-4 flex cursor-pointer items-center justify-center lg:mx-8"
        @click="goToMap()"
      >
        <div
          class="mx-auto flex w-(--ui-container) max-w-228 min-w-0 cursor-auto flex-col gap-8 lg:gap-16"
          @click.stop=""
        >
          <div>
            <h1
              class="mb-6 text-4xl text-white lg:text-7xl"
              data-testid="landing-claim"
            >
              {{ t("landing.footer.claim") }}
            </h1>
            <p class="text-lg leading-small-text font-medium text-white">
              {{ t("landing.footer.description") }}
            </p>
          </div>
          <ClientOnly>
            <div
              id="search-bar"
              class="rounded-lg bg-primary-50 p-4 dark:bg-primary-800"
            >
              <TopbarSearch
                class="w-full"
                :skip-mobile="true"
                large
                @selected="goToMap()"
                @coordinates-detected="goToMap()"
              />
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
    <div
      class="mx-auto flex max-w-(--ui-container) flex-col gap-8 p-4 pt-8 pb-16 lg:p-8 lg:pb-16"
    >
      <div>
        <p class="mb-4 text-xl font-semibold text-highlighted lg:text-3xl">
          SWISSGEO
        </p>
        <p class="text-base leading-small-text font-medium text-highlighted">
          {{ t("landing.body.who") }}
        </p>
      </div>
      <div class="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <UPageCard
          :title="t('landing.cards.map.title')"
          :description="t('landing.cards.map.description')"
          icon="i-lucide-map"
          variant="outline"
          :ui="outlineCardUi"
          @click="goToMap()"
        >
          <template #footer>
            <UButton
              icon="i-lucide-arrow-right"
              variant="link"
              class="px-space-xs py-space-2xs"
              :ui="{ leadingIcon: 'size-5' }"
              data-testid="landing-map-button"
            >
              <span class="sr-only">{{ t("landing.cards.map.button") }}</span>
            </UButton>
          </template>
        </UPageCard>
        <UPageCard
          :title="t('landing.cards.catalog.title')"
          :description="t('landing.cards.catalog.description')"
          icon="i-lucide-list-todo"
          variant="outline"
          :ui="outlineCardUi"
          @click="goToMap(true)"
        >
          <template #footer>
            <UButton
              icon="i-lucide-arrow-right"
              variant="link"
              class="px-space-xs py-space-2xs"
              :ui="{ leadingIcon: 'size-5' }"
            >
              <span class="sr-only">{{
                t("landing.cards.catalog.button")
              }}</span>
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
            ...cardUi,
            root: `${cardUi.root} bg-primary-50 hover:bg-primary-100 dark:bg-primary-800 dark:hover:bg-primary-700`,
          }"
        >
          <template #footer>
            <UButton
              icon="i-lucide-external-link"
              variant="link"
              class="px-space-xs py-space-2xs"
              :ui="{ leadingIcon: 'size-5' }"
            >
              <span class="sr-only">{{ t("landing.cards.info.button") }}</span>
            </UButton>
          </template>
        </UPageCard>
      </div>
    </div>
    <UFooter
      :ui="{
        container:
          'bg-elevated max-w-full py-16 lg:py-16 px-4 lg:px-8 lg:justify-normal lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-8',
        left: 'hidden',
        right:
          'flex-col lg:items-start lg:justify-start lg:order-1 lg:row-span-2 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:grid-rows-subgrid',
        center:
          'flex-col lg:items-start lg:order-2 lg:row-span-2 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:grid-rows-subgrid',
      }"
    >
      <template #right>
        <p
          class="w-full text-2xl leading-heading font-semibold lg:col-start-1 lg:row-start-1 lg:self-end"
        >
          SWISSGEO<br />{{ t("landing.footer.claim") }}
        </p>
        <p
          class="mt-4 w-full text-sm leading-small-text font-medium lg:col-start-1 lg:row-start-2"
        >
          {{ t("landing.footer.description") }}
        </p>
        <p
          class="mt-8 w-full text-lg leading-normal font-semibold lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-end"
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
      <p
        class="w-full text-lg leading-normal font-semibold lg:row-start-1 lg:self-end"
      >
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
      class="flex flex-col gap-8 bg-neutral-50 px-4 py-8 text-sm leading-small-text font-medium lg:flex-row-reverse lg:items-center lg:p-8 dark:bg-neutral-900"
    >
      <div
        class="text-accent grid grid-cols-2 gap-4 lg:flex lg:w-1/2 lg:flex-row lg:items-center"
      >
        <UButton
          variant="link"
          color="error"
          size="md"
          class="mb-4 gap-1.5 px-0 lg:mr-12 lg:mb-0 lg:text-left"
          :to="reportIssuePortalUrl"
          target="_blank"
          external
        >
          <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
          {{ t("footer.reportIssue.buttonTitle") }}
        </UButton>
        <div class="lg:hidden"></div>
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
