import * as z from "zod";

/**
 * The zod schema and TS types for the layer catalog files in `server/assets/layerCatalog/`.
 */

export const catalogLayerItemSchema = z
  .strictObject({
    type: z.literal("layer"),
    layerId: z.string().min(1),
  })
  .meta({
    id: "catalogLayerItem",
    description:
      "A single layer. Its title is not stored here: it is fetched per locale from the OGC API record with this id.",
  });

export const catalogGroupItemSchema = z
  .strictObject({
    type: z.literal("group"),
    label: z.string().min(1),
    /**
     * Using a getter, so we can self-reference to catalogGroupItemSchema.
     */
    get children() {
      return z.array(
        z.union([catalogGroupItemSchema, catalogLayerItemSchema]),
      );
    },
  })
  .meta({
    id: "catalogGroupItem",
    description: "A named, collapsible group holding layers and other groups.",
  });

export const catalogItemSchema = z.discriminatedUnion("type", [
  catalogGroupItemSchema,
  catalogLayerItemSchema,
]);

/**
 * A whole catalog file. The top level is a list of groups,
 * meaning a layer cannot cannot be at the root of the tree.
 */
export const catalogFileSchema = z
  .strictObject({
    items: z.array(catalogGroupItemSchema),
  })
  .meta({
    id: "layerCatalog",
    description: "The entire layer catalog.",
  });

export type CatalogLayerItem = z.infer<typeof catalogLayerItemSchema>;
export type CatalogGroupItem = z.infer<typeof catalogGroupItemSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type Catalog = CatalogGroupItem[];
