import type { ThesaurusConcept } from "~/types/thesaurus";

const THESAURUS_ID = "ech0166";

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

/** Loads the thesaurus concepts in the current language. Changing the language reloads them. */
export function useThesaurus() {
  const { locale } = useI18n();
  const { thesaurusServiceUrl } = useRuntimeConfig().public;

  const { data, status, error } = useFetch(
    () => `${thesaurusServiceUrl}/${THESAURUS_ID}.${locale.value}.json`,
    {
      transform: (response: ThesaurusResponse) =>
        response.concepts.map(toConcept),
      // The thesaurus is only shown on demand, so it must not hold up the server rendering
      server: false,
      lazy: true,
    },
  );

  return { concepts: data, status, error };
}
