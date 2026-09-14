<script lang="ts" setup>
import { SidebarType, useSidebarStore } from "@swissgeo/skeleton";
import { useI18n } from "vue-i18n";

import LayerCatalogTable from "./LayerCatalogTable.vue";

const uiStore = useSidebarStore();
const { t } = useI18n();

function closeLayerCatalog() {
  uiStore.setSidebar(SidebarType.LAYER_CART);
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div
      class="flex items-center justify-between border-b border-default px-4 py-3"
    >
      <h3 class="text-sm text-highlighted uppercase">
        {{ t("layerCatalog.title") }}
      </h3>
      <UButton
        color="primary"
        variant="outline"
        size="xs"
        trailing-icon="i-lucide-x"
        class="cursor-pointer"
        @click="closeLayerCatalog"
      >
        {{ t("layerCatalog.close") }}
      </UButton>
    </div>
    <div class="flex min-h-0 flex-1">
      <div class="w-75 border-r border-default px-2 py-3"></div>
      <LayerCatalogTable />
    </div>
  </div>
</template>
