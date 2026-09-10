<script lang="ts" setup>
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { useI18n } from "vue-i18n";

import LayerCatalogLayerTable from "./LayerCatalogLayerTable.vue";

const uiStore = useSidebarStore();
const { t } = useI18n();

function closeLayerCatalog() {
  uiStore.setSidebar(SidebarType.LAYER_CART);
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div
      class="flex items-center justify-between border-b border-gray-200 px-4 py-3"
    >
      <h3 class="text-sm font-bold text-gray-900">{{ t("menu.catalog") }}</h3>
      <UButton
        color="primary"
        size="sm"
        class="cursor-pointer rounded-full"
        @click="closeLayerCatalog"
      >
        {{ t("menu.closeCatalog") }}
      </UButton>
    </div>
    <div class="flex min-h-0 flex-1">
      <div class="w-75 border-r border-gray-200 bg-muted/30 px-2 py-3"></div>
      <LayerCatalogLayerTable />
    </div>
  </div>
</template>
