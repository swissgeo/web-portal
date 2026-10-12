<script lang="ts" setup>
import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";

import { useI18n } from "vue-i18n";

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
      children: concept.children?.map(toTreeNode),
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
  <p v-if="status === 'error'" class="text-sm text-error">
    {{ t("layerCatalog.error") }}
  </p>
  <p v-else-if="status !== 'success'" class="text-sm text-muted">
    {{ t("layerCatalog.loading") }}
  </p>
  <UTree
    v-else
    v-model="selected"
    :items
    v-model:expanded="expanded"
    selection-behavior="replace"
    :get-key="(node) => node.id"
    collapsed-icon="i-lucide-chevron-right"
    expanded-icon="i-lucide-chevron-down"
    color="accent"
    :ui="{
      listWithChildren: 'border-s-0',
      link: 'items-start px-2 py-1 text-start font-medium text-accent not-data-selected:hover:text-accent-hover data-expanded:text-accent-active data-selected:text-accent-active',
      linkLabel: 'whitespace-normal!',
      linkTrailing: 'hidden',
    }"
  />
</template>
