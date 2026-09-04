import type { TreeItem, TreeSlots } from "@nuxt/ui";

import type { LayerRecord } from "@/components/sidebar/useLayerRecords";

/**
 * What a node of the catalog tree stands for: a group knows its label upfront,
 * a layer only knows its title once its record has been fetched.
 */
export type CatalogTreeItemData =
  | { type: "group" }
  | { type: "layer"; record: LayerRecord };

/**
 * Use the TREE_ITEM_DATA symbol to attach auxiliary data to items in the
 * Nuxt UI UTree, so that it can never collide with a key of the tree's own.
 */
export const TREE_ITEM_DATA = Symbol("treeItemData");

export type CatalogTreeItem = TreeItem & {
  [TREE_ITEM_DATA]: CatalogTreeItemData;
};

/** The classes the tree hands its slots for the parts of a node. */
export type TreeUi = Parameters<NonNullable<TreeSlots["item"]>>[0]["ui"];
