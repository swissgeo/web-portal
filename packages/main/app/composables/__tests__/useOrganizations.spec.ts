import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useOrganizations } from "../useOrganizations";

const { locale, useFetchMock } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { locale: ref("de"), useFetchMock: vi.fn() };
});

mockNuxtImport("useI18n", () => () => ({ locale }));
mockNuxtImport("useRuntimeConfig", () => () => ({
  public: { ogcApiEndpoint: "https://api.example.com/" },
}));
mockNuxtImport("useFetch", () => useFetchMock);

type FetchOptions = {
  query: Record<string, unknown>;
  transform: (_response: unknown) => unknown;
  server: boolean;
  lazy: boolean;
};

function fetchCall() {
  const [url, options] = useFetchMock.mock.lastCall! as [string, FetchOptions];
  return { url, options };
}

function organization(id: string, acronym: string, name: string) {
  return {
    id,
    type: "Feature",
    properties: { type: "Organization", name, acronym },
  };
}

describe("useOrganizations", () => {
  beforeEach(() => {
    locale.value = "de";
    useFetchMock.mockReset().mockReturnValue({
      data: ref(),
      status: ref("pending"),
    });
  });

  it("loads all organizations in the current language", () => {
    useOrganizations();
    const { url, options } = fetchCall();

    expect(url).toBe(
      "https://api.example.com/collections/swissgeo-organizations/items",
    );
    expect(options.query).toEqual({ lang: locale, limit: 100 });
  });

  it("only loads on the client, without blocking navigation", () => {
    useOrganizations();

    expect(fetchCall().options).toMatchObject({ server: false, lazy: true });
  });

  it("returns the organizations sorted by acronym, ignoring the case", () => {
    useOrganizations();

    const organizations = fetchCall().options.transform({
      features: [
        organization("ch.astra", "ASTRA", "Bundesamt für Strassen ASTRA"),
        organization("ch.armasuisse", "armasuisse", "armasuisse"),
        organization("ch.are", "ARE", "Bundesamt für Raumentwicklung ARE"),
      ],
    });

    expect(organizations).toEqual([
      {
        id: "ch.are",
        acronym: "ARE",
        name: "Bundesamt für Raumentwicklung ARE",
      },
      { id: "ch.armasuisse", acronym: "armasuisse", name: "armasuisse" },
      {
        id: "ch.astra",
        acronym: "ASTRA",
        name: "Bundesamt für Strassen ASTRA",
      },
    ]);
  });

  it("returns the organizations and the loading state", () => {
    const data = ref([]);
    const status = ref("success");
    useFetchMock.mockReturnValue({ data, status });

    expect(useOrganizations()).toEqual({ organizations: data, status });
  });
});
