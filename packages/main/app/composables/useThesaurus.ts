import type { ThesaurusConcept } from "~/types/thesaurus";

const THESAURUS_ID = "ech0166";

/**
 * Number of levels shown in the catalog tree, below its "all layers"
 * root. Deeper concepts take the place of the parent group.
 */
export const MAX_CONCEPT_DEPTH = 2;

type ThesaurusResponse = {
  thesaurus_id: string;
  concepts: ThesaurusResponseConcept[];
};

type ThesaurusResponseConcept = {
  concept_id: string;
  label: string;
  children?: ThesaurusResponseConcept[];
};

function toConcept(concept: ThesaurusResponseConcept): ThesaurusConcept {
  return {
    id: concept.concept_id,
    label: concept.label,
    children: (concept.children ?? []).map(toConcept),
  };
}

/**
 * Keeps `depth` levels of concepts. On the last level, a concept with children
 * is replaced by its children.
 */
function limitDepth(
  concepts: ThesaurusConcept[],
  depth: number,
): ThesaurusConcept[] {
  if (depth > 1) {
    return concepts.map((concept) => ({
      ...concept,
      children: limitDepth(concept.children, depth - 1),
    }));
  }
  return concepts.flatMap((concept) =>
    concept.children.length ? limitDepth(concept.children, 1) : [concept],
  );
}

/** Loads the thesaurus concepts in the current language. Changing the language reloads them. */
export function useThesaurus() {
  const { locale } = useI18n();
  const { thesaurusServiceUrl } = useRuntimeConfig().public;

  const { data, status, error } = useFetch(
    () => `${thesaurusServiceUrl}/${THESAURUS_ID}.${locale.value}.json`,
    {
      transform: (response: ThesaurusResponse) =>
        limitDepth(response.concepts.map(toConcept), MAX_CONCEPT_DEPTH),
      // The thesaurus is only shown on demand, so it must not hold up the server rendering
      server: false,
      lazy: true,
    },
  );

  return { concepts: data, status, error };
}
