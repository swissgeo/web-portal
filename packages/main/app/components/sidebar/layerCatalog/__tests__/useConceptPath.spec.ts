import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";

import useConceptPath, {
  collectConceptIds,
} from "~/components/sidebar/layerCatalog/useConceptPath";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const soils: ThesaurusConcept = { id: "soils", label: "Boden", children: [] };
const geology: ThesaurusConcept = {
  id: "geology",
  label: "Geologie",
  children: [],
};
const geoscience: ThesaurusConcept = {
  id: "geoscience",
  label: "Geowissenschaften",
  children: [soils, geology],
};
const nature: ThesaurusConcept = {
  id: "nature",
  label: "Natur und Umwelt",
  children: [geoscience],
};
const planning: ThesaurusConcept = {
  id: "planning",
  label: "Planung",
  children: [],
};
const concepts = [nature, planning];

const root = {
  id: null,
  label: "layerCatalog.allLayers",
  children: concepts,
};

describe("useConceptPath", () => {
  it("only contains the root when the root is selected", () => {
    const path = useConceptPath(concepts, "success", null);

    expect(path.value).toEqual([root]);
  });

  it("leads from the root down to the selected concept", () => {
    const path = useConceptPath(concepts, "success", "soils");

    expect(path.value).toEqual([
      root,
      { id: "nature", label: "Natur und Umwelt", children: [geoscience] },
      {
        id: "geoscience",
        label: "Geowissenschaften",
        children: [soils, geology],
      },
      { id: "soils", label: "Boden", children: [] },
    ]);
  });

  it("only contains the root when the selected concept does not exist", () => {
    const path = useConceptPath(concepts, "success", "unknown");

    expect(path.value).toEqual([root]);
  });

  it.each<AsyncDataRequestStatus>(["idle", "pending", "error"])(
    "is empty while the status is %s",
    (status) => {
      const path = useConceptPath(concepts, status, "soils");

      expect(path.value).toEqual([]);
    },
  );

  it("follows the selection and the loading of the concepts", () => {
    const loaded = ref<ThesaurusConcept[]>();
    const status = ref<AsyncDataRequestStatus>("pending");
    const conceptId = ref<string | null>("planning");

    const path = useConceptPath(loaded, status, conceptId);
    expect(path.value).toEqual([]);

    loaded.value = concepts;
    status.value = "success";
    expect(path.value.map((entry) => entry.id)).toEqual([null, "planning"]);

    conceptId.value = "geoscience";
    expect(path.value.map((entry) => entry.id)).toEqual([
      null,
      "nature",
      "geoscience",
    ]);
  });
});

describe("collectConceptIds", () => {
  it("collects the concepts and all concepts below them", () => {
    expect(collectConceptIds(concepts)).toEqual([
      "nature",
      "geoscience",
      "soils",
      "geology",
      "planning",
    ]);
  });

  it("is empty without concepts", () => {
    expect(collectConceptIds([])).toEqual([]);
  });
});
