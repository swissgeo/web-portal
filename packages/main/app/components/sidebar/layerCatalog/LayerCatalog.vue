<script lang="ts" setup>
import LayerCatalogBreadcrumb from "./LayerCatalogBreadcrumb.vue";
import LayerCatalogTable from "./LayerCatalogTable.vue";
import LayerCatalogTree from "./LayerCatalogTree.vue";
import LayerCatalogTreeMobile from "./LayerCatalogTreeMobile.vue";
import useConceptPath, { collectConceptIds } from "./useConceptPath";

const conceptId = ref<string | null>(null);

const { concepts, status } = useThesaurus();
const path = useConceptPath(concepts, status, conceptId);
const parentLabel = computed(() => path.value.at(-2)?.label);
const currentLabel = computed(() => path.value.at(-1)?.label);

// The selected concept and all concepts below it, none for all layers. Kept
// while the concepts are reloaded, so the table isn't reloaded unfiltered.
const filterConceptIds = computed<string[]>((previous) => {
  if (status.value !== "success") {
    return previous ?? [];
  }
  const current = path.value.at(-1);
  return current?.id
    ? [current.id, ...collectConceptIds(current.children)]
    : [];
});

const isDesktop = useIsDesktop();

// On mobile there is only room for either the tree or the table. On desktop
// both are shown and this is ignored.
const mobileView = ref<"table" | "tree">("table");
const isTableVisible = computed(
  () => isDesktop.value || mobileView.value === "table",
);

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
      v-if="isDesktop"
      class="w-75 shrink-0 overflow-y-auto border-r border-default px-4 py-3"
    >
      <LayerCatalogTree v-model:concept-id="conceptId" :concepts :status />
    </div>
    <LayerCatalogTreeMobile
      v-else-if="mobileView === 'tree'"
      v-model:concept-id="conceptId"
      :concepts
      :status
      @close="mobileView = 'table'"
    />
    <div
      v-show="isTableVisible"
      ref="tableColumn"
      class="flex min-w-0 flex-1 flex-col gap-4 px-4 py-3 md:gap-8 md:overflow-y-auto md:p-8"
    >
      <div
        v-if="!isDesktop && currentLabel"
        class="border-y border-default py-2"
      >
        <UButton
          color="accent"
          variant="ghost"
          block
          trailing-icon="i-lucide-chevron-right"
          @click="mobileView = 'tree'"
        >
          {{ currentLabel }}
        </UButton>
      </div>
      <LayerCatalogBreadcrumb :parentLabel :currentLabel :status />
      <LayerCatalogTable :conceptIds="filterConceptIds" />
    </div>
  </div>
</template>
