import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";
import type { MaybeRefOrGetter } from "vue";

import { computed, toValue } from "vue";
import { useI18n } from "vue-i18n";

/** A concept, or the root that stands for all layers and has the id `null` */
export type ConceptPathEntry = {
  id: string | null;
  label: string;
  children: ThesaurusConcept[];
};

/**
 * Returns the concepts from the top level down to the one with the given id, or
 * an empty array when there is no such concept.
 */
function findConceptPath(
  concepts: ThesaurusConcept[],
  id: string,
): ThesaurusConcept[] {
  for (const concept of concepts) {
    if (concept.id === id) {
      return [concept];
    }
    const path = findConceptPath(concept.children ?? [], id);
    if (path.length > 0) {
      return [concept, ...path];
    }
  }
  return [];
}

/**
 * Entries from the root down to the selected concept. A `conceptId` of `null`
 * selects the root. The path is empty until the concepts are loaded.
 */
export default function useConceptPath(
  concepts: MaybeRefOrGetter<ThesaurusConcept[] | undefined>,
  status: MaybeRefOrGetter<AsyncDataRequestStatus>,
  conceptId: MaybeRefOrGetter<string | null>,
) {
  const { t } = useI18n();

  return computed<ConceptPathEntry[]>(() => {
    if (toValue(status) !== "success") {
      return [];
    }
    const topLevel = toValue(concepts) ?? [];
    const id = toValue(conceptId);
    const path = id === null ? [] : findConceptPath(topLevel, id);
    return [
      { id: null, label: t("layerCatalog.allLayers"), children: topLevel },
      ...path.map((concept) => ({
        id: concept.id,
        label: concept.label,
        children: concept.children ?? [],
      })),
    ];
  });
}
