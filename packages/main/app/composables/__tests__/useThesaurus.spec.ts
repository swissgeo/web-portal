import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useThesaurus } from "../useThesaurus";

const { locale, useFetchMock } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { locale: ref("de"), useFetchMock: vi.fn() };
});

mockNuxtImport("useI18n", () => () => ({ locale }));
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { thesaurusServiceUrl: "https://thesauri.example.test" },
}));
mockNuxtImport("useFetch", () => useFetchMock);

type FetchOptions = {
  transform: (_response: unknown) => unknown;
  server: boolean;
  lazy: boolean;
};

function fetchCall() {
  const [url, options] = useFetchMock.mock.lastCall! as [
    () => string,
    FetchOptions,
  ];
  return { url, options };
}

describe("useThesaurus", () => {
  beforeEach(() => {
    locale.value = "de";
    useFetchMock.mockReset().mockReturnValue({
      data: ref(),
      status: ref("pending"),
      error: ref(),
    });
  });

  it("loads the eCH-0166 thesaurus in the current language", () => {
    useThesaurus();
    const { url } = fetchCall();

    expect(url()).toBe("https://thesauri.example.test/ech0166.de.json");

    locale.value = "fr";
    expect(url()).toBe("https://thesauri.example.test/ech0166.fr.json");
  });

  it("only loads on the client, without blocking navigation", () => {
    useThesaurus();

    expect(fetchCall().options).toMatchObject({ server: false, lazy: true });
  });

  it("converts the concepts of the response", () => {
    useThesaurus();

    const concepts = fetchCall().options.transform({
      thesaurus_id: "ech0166",
      concepts: [
        {
          concept_id: "nature",
          label: "Natur und Umwelt",
          children: [{ concept_id: "soils", label: "Boden", children: [] }],
        },
      ],
    });

    expect(concepts).toEqual([
      {
        id: "nature",
        label: "Natur und Umwelt",
        children: [{ id: "soils", label: "Boden", children: [] }],
      },
    ]);
  });

  it("gives concepts without children in the response an empty list of children", () => {
    useThesaurus();

    const concepts = fetchCall().options.transform({
      thesaurus_id: "ech0166",
      concepts: [{ concept_id: "planning", label: "Planung" }],
    });

    expect(concepts).toEqual([
      { id: "planning", label: "Planung", children: [] },
    ]);
  });

  it("replaces concepts below the maximum depth with its children", () => {
    useThesaurus();

    const leaf = (id: string) => ({ concept_id: id, label: id, children: [] });
    const concepts = fetchCall().options.transform({
      thesaurus_id: "ech0166",
      concepts: [
        {
          concept_id: "planning",
          label: "Grundlagen und Planung",
          children: [
            {
              concept_id: "imagery",
              label: "Grundlagen, Bilddaten",
              children: [
                leaf("baseMaps"),
                {
                  concept_id: "deeper",
                  label: "deeper",
                  children: [leaf("deepest")],
                },
              ],
            },
            leaf("location"),
          ],
        },
      ],
    });

    const expected = (id: string) => ({ id, label: id, children: [] });
    expect(concepts).toEqual([
      {
        id: "planning",
        label: "Grundlagen und Planung",
        children: [
          expected("baseMaps"),
          expected("deepest"),
          expected("location"),
        ],
      },
    ]);
  });

  it("returns the concepts and the loading state", () => {
    const data = ref([]);
    const status = ref("success");
    const error = ref();
    useFetchMock.mockReturnValue({ data, status, error });

    expect(useThesaurus()).toEqual({ concepts: data, status, error });
  });
});
