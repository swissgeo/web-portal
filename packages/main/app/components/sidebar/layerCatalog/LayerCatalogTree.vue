<script lang="ts" setup>
import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";

import { useI18n } from "vue-i18n";

import LayerCatalogLoadingStatus from "./LayerCatalogLoadingStatus.vue";

const { t } = useI18n();

/** `null` selects the root node, which stands for all layers */
const conceptId = defineModel<string | null>("conceptId", { required: true });

const { concepts, status } = defineProps<{
  concepts: ThesaurusConcept[] | undefined;
  /** Loading status of the concepts */
  status: AsyncDataRequestStatus;
}>();

type TreeNode = {
  id: string;
  conceptId: string | null;
  label: string;
  children?: TreeNode[];
};

const ROOT_NODE_ID = "root";

/**
 * Wraps the concepts in an "all layers" root node and creates a suitable data
 * structure for UTree.
 */
function useTreeItems(concepts: () => ThesaurusConcept[] | undefined) {
  function toTreeNode(concept: ThesaurusConcept): TreeNode {
    return {
      id: `node_${concept.id}`,
      conceptId: concept.id,
      label: concept.label,
      // UTree treats any children array, even an empty one, as a folder that
      // can be expanded, so leaves must not have one
      children: concept.children.length
        ? concept.children.map(toTreeNode)
        : undefined,
    };
  }

  return computed<TreeNode[]>(() => [
    {
      id: ROOT_NODE_ID,
      conceptId: null,
      label: t("layerCatalog.allLayers"),
      children: (concepts() ?? []).map(toTreeNode),
    },
  ]);
}

const items = useTreeItems(() => concepts);

// Kept here because the tree is removed while the concepts are reloaded in
// another language, which would collapse it again.
const expanded = ref([ROOT_NODE_ID]);

function findNode(
  nodes: TreeNode[],
  conceptId: string | null,
): TreeNode | undefined {
  for (const node of nodes) {
    if (node.conceptId === conceptId) {
      return node;
    }
    const match = findNode(node.children ?? [], conceptId);
    if (match) {
      return match;
    }
  }
  return undefined;
}

const selected = computed({
  get: () => findNode(items.value, conceptId.value),
  set: (node: TreeNode | undefined) => {
    conceptId.value = node?.conceptId ?? null;
  },
});
</script>

<template>
  <LayerCatalogLoadingStatus :status>
    <UTree
      v-model="selected"
      :items
      v-model:expanded="expanded"
      data-testid="catalog-tree"
      selection-behavior="replace"
      :get-key="(node) => node.id"
      collapsed-icon="i-lucide-chevron-right"
      expanded-icon="i-lucide-chevron-down"
      color="accent"
      :ui="{
        listWithChildren: 'border-s-0 ms-6',
        item: 'not-first:mt-0.5',
        link: 'items-start py-1 pr-2 pl-1 text-start leading-small-text font-medium text-accent not-data-selected:hover:text-accent-hover hover:before:bg-accent-50 dark:hover:before:bg-accent-800 data-expanded:text-accent-active data-selected:text-accent-active data-selected:before:bg-accent-100 dark:data-selected:before:bg-accent-800',
        linkLabel: 'whitespace-normal!',
        linkTrailing: 'hidden',
      }"
    />
  </LayerCatalogLoadingStatus>
</template>
