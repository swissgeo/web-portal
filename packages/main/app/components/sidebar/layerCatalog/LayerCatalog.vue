<script lang="ts" setup>
import LayerCatalogTable from "./LayerCatalogTable.vue";

const isDesktop = useIsDesktop();
const panelScroller = usePanelScroller();
const tableColumn = useTemplateRef<HTMLElement>("tableColumn");
provide(
  panelScrollerKey,
  computed(() => (isDesktop.value ? tableColumn.value : panelScroller.value)),
);
</script>

<template>
  <div class="flex min-h-full flex-col md:h-full md:flex-row">
    <div
      class="mx-4 border-y border-default py-3 md:mx-0 md:w-75 md:shrink-0 md:overflow-y-auto md:border-y-0 md:border-r md:px-4"
    >
      <!-- TODO: Add catalog tree here -->
    </div>
    <div ref="tableColumn" class="min-w-0 flex-1 md:overflow-y-auto">
      <LayerCatalogTable />
    </div>
  </div>
</template>
