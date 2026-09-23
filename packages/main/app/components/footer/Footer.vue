<script setup lang="ts">
import { Map, Layers3, Wrench } from "@lucide/vue";
import { OLMapScale, useMapStore } from "@swissgeo/map";
import { useMediaQuery } from "@vueuse/core";
const { olMap } = storeToRefs(useMapStore());
const isDesktop = useMediaQuery("(min-width: 768px)");
</script>

<template>
  <div
    v-bind="$attrs"
    v-if="isDesktop"
    class="text-accent absolute bottom-0 left-0 flex w-full items-center justify-between bg-muted p-1 text-xs"
  >
    <ClientOnly>
      <FooterMapInfos />
    </ClientOnly>
    <FooterLinks />
  </div>
  <div
    v-bind="$attrs"
    v-else
    class="text-accent absolute bottom-0 left-0 flex w-full items-center justify-center gap-1.5 bg-default p-1 pb-7"
  >
    <ClientOnly>
      <div class="absolute bottom-24 left-4 z-10">
        <UDrawer
          :overlay="false"
          inset
          :ui="{ content: 'mb-[73px] inset-x-0' }"
        >
          <UButton
            label="Karteninfo"
            color="neutral"
            variant="subtle"
            trailing-icon="i-lucide-chevron-down"
          />

          <template #content>
            <FooterLinksMobile />
          </template>
        </UDrawer>
        <OLMapScale :olMap="olMap" class="footerMapScale mt-2" />
      </div>
    </ClientOnly>
    <UButton variant="solid" class="h-14 w-28" :ui="{ base: 'flex flex-col' }">
      <Map />
      <span class="text-xs">Karte</span>
    </UButton>
    <UButton variant="ghost" class="h-14 w-28" :ui="{ base: 'flex flex-col' }">
      <Layers3 />
      <span class="text-xs">Daten-Katalog</span>
    </UButton>
    <UButton variant="ghost" class="h-14 w-28" :ui="{ base: 'flex flex-col' }">
      <Wrench />
      <span class="text-xs">Tools</span>
    </UButton>
  </div>
</template>

<style scoped>
.footerMapScale {
  position: initial;
}
</style>
