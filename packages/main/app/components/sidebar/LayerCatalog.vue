<script lang="ts" setup>
import type { CatalogItem } from "~/types/layerCatalog";

import { useLayerRecords } from "@/components/sidebar/useLayerRecords";

import type { CatalogTreeItem } from "./layerCatalogTree";

import LayerCatalogEntry from "./LayerCatalogEntry.vue";
import { TREE_ITEM_DATA } from "./layerCatalogTree";

const { t } = useI18n();
const { catalog, status } = useLayerCatalog();
const { layerRecord, loadRecords } = useLayerRecords();

/**
 * Loads the records of the layers directly under a group, all in one request.
 * Nested groups keep their own layers untouched until they are toggled in turn,
 * and re-toggling a group does not fetch anything again.
 */
function loadChildRecords(children: CatalogTreeItem[]): void {
  loadRecords(
    children.flatMap((child) => {
      const data = child[TREE_ITEM_DATA];
      return data.type === "layer" ? [data.record] : [];
    }),
  );
}

function convertToTree(catalogItems: CatalogItem[]): CatalogTreeItem[] {
  return catalogItems.map((catalogItem) => {
    if (catalogItem.type === "group") {
      const children = convertToTree(catalogItem.children);
      return {
        label: catalogItem.label,
        children,
        onToggle: () => loadChildRecords(children),
        [TREE_ITEM_DATA]: { type: "group" },
      };
    }
    return {
      // The label is what the tree keys the node on; the title a layer shows
      // is fetched with its record.
      label: catalogItem.layerId,
      [TREE_ITEM_DATA]: {
        type: "layer",
        record: layerRecord(catalogItem.layerId),
      },
    };
  });
}

const treeItems = computed(() => convertToTree(catalog.value));
const value = ref();
</script>

<template>
  <!-- The catalog comes from the server, so the tree only exists once it lands -->
  <div v-if="status === 'pending'" class="flex flex-col gap-2">
    <USkeleton v-for="row in 4" :key="row" class="h-6 w-full" />
  </div>
  <UAlert
    v-else-if="status === 'error'"
    color="error"
    variant="subtle"
    :title="t('error.generic')"
  />
  <!-- Nodes render as divs rather than the tree's default buttons, so that the
       add button of a layer entry is not nested inside another button -->
  <UTree v-else :items="treeItems" v-model="value" :as="{ link: 'div' }">
    <!-- Every node renders through this slot, so that the kind of node decides
         what is rendered rather than a slot name set while building the tree -->
    <template #item="{ item, expanded, ui }">
      <LayerCatalogEntry :item="item" :expanded="expanded" :ui="ui" />
    </template>
  </UTree>
</template>
