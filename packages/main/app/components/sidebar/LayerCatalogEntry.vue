<script lang="ts" setup>
import { makeServerLayer, useLayerStore } from "@swissgeo/layers";
import log from "@swissgeo/log";

import type { CatalogTreeItem, TreeUi } from "./layerCatalogTree";

import { TREE_ITEM_DATA } from "./layerCatalogTree";

/**
 * A node of the catalog tree: a group, or a layer with the button adding it to
 * the map. Every node renders through here, so a group has to spell out what
 * the tree renders for a node of its own.
 */
const { item, expanded, ui } = defineProps<{
  item: CatalogTreeItem;
  /** Whether a group is unfolded, which is what its folder icon shows. */
  expanded: boolean;
  /** The classes the tree gives to the parts of a node. */
  ui: TreeUi;
}>();

const { t } = useI18n();
const appConfig = useAppConfig();
const toast = useToast();
const layerStore = useLayerStore();

/** What this node stands for, which decides what is rendered. */
const data = computed(() => item[TREE_ITEM_DATA]);

/** Where the record of a layer stands; a group has no record of its own. */
const layerState = computed(() =>
  data.value.type === "layer" ? data.value.record.state.value : undefined,
);

/** The dataset the layer is made from, once its catalog record has been fetched. */
const dataset = computed(() => {
  const state = layerState.value;
  return state?.status === "success" ? state.dataset : undefined;
});

/**
 * The text to render: the layer's title once fetched, standing in for it while
 * it is on its way or has failed.
 */
const title = computed(() => {
  const state = layerState.value;
  switch (state?.status) {
    case "success":
      return state.dataset.properties.title;
    case "error":
      return t("layerCatalog.titleError");
    // No status at all is a group, which shows its own label rather than a title
    case "idle":
    case "pending":
    case undefined:
      return t("layerCatalog.titleLoading");
  }
});

const isOnMap = computed(
  () =>
    !!dataset.value &&
    layerStore.layers.some((layer) => layer.humanId === dataset.value?.id),
);

/** A layer can only be added once its record is there and it is not on the map. */
const canAddToMap = computed(() => !!dataset.value && !isOnMap.value);

const addToMapLabel = computed(() =>
  isOnMap.value ? t("dataset.alreadyOnMap") : t("dataset.addToMap"),
);

function addToMap(): void {
  if (!dataset.value) {
    return;
  }
  try {
    layerStore.addLayer(makeServerLayer(dataset.value));
  } catch (e) {
    log.error(
      "Failed to add catalog layer to map",
      e instanceof Error ? e : new Error(String(e)),
    );
    toast.add({ color: "error", title: t("dataset.addToMapError") });
  }
}
</script>

<template>
  <template v-if="data.type === 'layer'">
    <span class="min-w-0 truncate">{{ title }}</span>
    <!-- click.stop, so that adding a layer does not also select the tree node -->
    <UButton
      data-testid="catalog-add-layer"
      icon="i-lucide-plus"
      color="primary"
      variant="ghost"
      size="xs"
      class="ms-auto shrink-0 cursor-pointer"
      :disabled="!canAddToMap"
      :title="addToMapLabel"
      :aria-label="addToMapLabel"
      @click.stop="addToMap"
    />
  </template>
  <!-- A group renders what the tree renders for a node of its own: the folder
       icon of its state, its label, and the chevron folding it open and shut -->
  <template v-else>
    <UIcon
      :name="
        expanded ? appConfig.ui.icons.folderOpen : appConfig.ui.icons.folder
      "
      :class="ui.linkLeadingIcon()"
    />
    <span :class="ui.linkLabel()">{{ item.label }}</span>
    <span :class="ui.linkTrailing()">
      <UIcon
        :name="appConfig.ui.icons.chevronDown"
        :class="ui.linkTrailingIcon()"
      />
    </span>
  </template>
</template>
