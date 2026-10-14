<script setup lang="ts">
import { Map, Layers3, Wrench } from "@lucide/vue";
import { OLMapScale, useMapStore } from "@swissgeo/map";
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
const { olMap } = storeToRefs(useMapStore());
const sidebarStore = useSidebarStore();
const { t } = useI18n();
const isDesktop = useIsDesktop();
const localePath = useLocalePath();
const route = useRoute();
const isDatasetOpen = computed(() => route.meta.datasetDetail === true);

const mobileNavButtons = computed(() => [
  {
    icon: Map,
    label: t("footer.mobileNav.map"),
    variant:
      sidebarStore.isLayerCartVisible && !sidebarStore.isGeocatalogTreeVisible
        ? ("solid-inverted" as const)
        : ("ghost-inverted" as const),
    onClick: () => {
      // sidebar store holds open mobile drawer.
      // If cart drawer is shown, close it. dataset pages hide cart
      // but keep it open in store, so it does not count as shown.
      if (sidebarStore.isLayerCartVisible && !isDatasetOpen.value) {
        sidebarStore.closeSidebar();
        return;
      }
      // open the cart on the map page where the drawers show
      sidebarStore.setSidebar(SidebarType.LAYER_CART);
      return navigateTo(localePath("/map"));
    },
  },
  {
    icon: Layers3,
    label: t("footer.mobileNav.catalog"),
    variant: sidebarStore.isGeocatalogTreeVisible
      ? ("solid-inverted" as const)
      : ("ghost-inverted" as const),
    onClick: () => {
      sidebarStore.setSidebar(SidebarType.GEOCATALOG_TREE);
      // Some routes hide the sidebar, so go to the map, where the catalog always shows.
      return navigateTo(localePath("/map"));
    },
  },
  {
    icon: Wrench,
    label: t("footer.mobileNav.tools"),
    variant: "ghost-inverted" as const,
  },
]);

const wrapperClasses = computed(() => {
  return isDesktop.value
    ? "text-accent absolute bottom-0 left-0 z-50 flex w-full items-center justify-between bg-muted p-1 text-xs"
    : "text-accent absolute bottom-0 left-0 z-50 flex w-full items-center justify-center gap-2 bg-primary-50 dark:bg-primary-800 p-1";
});
</script>

<template>
  <template v-if="isDesktop">
    <div :class="wrapperClasses">
      <ClientOnly>
        <FooterMapInfos />
      </ClientOnly>
      <FooterLinks />
    </div>
  </template>
  <template v-else>
    <ClientOnly>
      <div class="absolute bottom-18 left-4 z-10">
        <UDrawer
          :handle="false"
          :overlay="false"
          inset
          close
          :ui="{
            content: 'mb-[70px] inset-x-0 rounded-none',
            title: 'text-base',
          }"
          :title="t('footer.mobileNav.mapInfo')"
        >
          <UButton
            :label="t('footer.mobileNav.mapInfo')"
            color="neutral"
            variant="subtle"
            trailing-icon="i-lucide-chevron-down"
          />

          <template #body>
            <FooterLinks mobile />
          </template>
        </UDrawer>
        <OLMapScale v-if="olMap" :olMap="olMap" class="footerMapScale mt-2" />
      </div>
    </ClientOnly>
    <div :class="wrapperClasses">
      <UButton
        v-for="btn in mobileNavButtons"
        :key="btn.label"
        v-bind="btn"
        color="primary"
        class="h-14 w-28"
        :ui="{ base: 'flex flex-col' }"
      />
    </div>
  </template>
</template>

<style scoped>
.footerMapScale {
  position: initial;
}
</style>
