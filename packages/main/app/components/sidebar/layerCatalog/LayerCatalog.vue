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
    <div ref="tableColumn" class="min-w-0 flex-1 md:overflow-y-auto">
      <LayerCatalogTable />
    </div>
  </div>
</template>
