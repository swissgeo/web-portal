<script setup lang="ts">
import { Map, Layers3, Wrench } from "@lucide/vue";
import { OLMapScale, useMapStore } from "@swissgeo/map";
import { useMediaQuery } from "@vueuse/core";
const { olMap } = storeToRefs(useMapStore());
const { t } = useI18n();
const isDesktop = useMediaQuery("(min-width: 768px)");

const mobileNavButtons = computed(() => [
  { icon: Map, label: t("footer.mobileNav.map"), variant: "solid" as const },
  {
    icon: Layers3,
    label: t("footer.mobileNav.catalog"),
    variant: "ghost" as const,
  },
  {
    icon: Wrench,
    label: t("footer.mobileNav.tools"),
    variant: "ghost" as const,
  },
]);

const wrapperClasses = computed(() => {
  return isDesktop.value
    ? "text-accent absolute bottom-0 left-0 z-50 flex w-full items-center justify-between bg-muted p-1 text-xs"
    : "text-accent absolute bottom-0 left-0 z-50 flex w-full items-center justify-center gap-1.5 bg-default p-1 pb-7";
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
    <div :class="wrapperClasses">
      <ClientOnly>
        <div class="absolute bottom-24 left-4 z-10">
          <UDrawer
            :overlay="false"
            inset
            :ui="{ content: 'mb-[73px] inset-x-0' }"
          >
            <UButton
              :label="t('footer.mobileNav.mapInfo')"
              color="neutral"
              variant="subtle"
              trailing-icon="i-lucide-chevron-down"
            />

            <template #content>
              <FooterLinks mobile />
            </template>
          </UDrawer>
          <OLMapScale :olMap="olMap" class="footerMapScale mt-2" />
        </div>
      </ClientOnly>
      <UButton
        v-for="btn in mobileNavButtons"
        :key="btn.label"
        v-bind="btn"
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
