export type ThesaurusConcept = {
  id: string;
  label: string;
  children?: ThesaurusConcept[];
};
