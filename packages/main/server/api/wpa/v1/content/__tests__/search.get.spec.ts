import { beforeEach, describe, expect, it, vi } from "vitest";

const livingdocsFetch = vi.fn();

(globalThis as Record<string, unknown>).defineEventHandler = (
  fn: (_event: unknown) => unknown,
) => fn;

vi.mock("h3", () => ({
  getQuery: (event: { query: Record<string, unknown> }) => event.query,
  createError: (opts: { statusCode: number; statusMessage?: string }) => {
    const err = new Error(opts.statusMessage ?? "error") as Error & {
      statusCode?: number;
    };
    err.statusCode = opts.statusCode;
    return err;
  },
}));

vi.mock("../../../../../utils/livingdocs", () => ({
  livingdocsFetch,
  resolveLivingdocsLanguage: (lang?: string) =>
    lang === "fr" ? "fr" : "de" /* mirrors the de/fr-only tenant */,
}));

const handler = (await import("../search.get")).default as (
  _event: unknown,
) => Promise<{ results: Record<string, string>[] }>;

const publication = (documentId: number, title: string) => ({
  systemdata: { documentId },
  metadata: {
    title,
    description: "A description",
    slug: "a-slug",
    language: { locale: "de" },
  },
});

const call = (query: Record<string, unknown>) => handler({ query });

beforeEach(() => {
  livingdocsFetch.mockReset();
});

describe("GET /api/wpa/v1/content/search", () => {
  it("maps the publications to content page results", async () => {
    livingdocsFetch.mockResolvedValue({
      results: [publication(42, "Über uns")],
      total: 1,
    });

    await expect(call({ q: "uns", lang: "de" })).resolves.toEqual({
      results: [
        {
          documentId: "42",
          title: "Über uns",
          description: "A description",
          slug: "a-slug",
          locale: "de",
        },
      ],
    });

    expect(livingdocsFetch).toHaveBeenCalledWith("publications/search", {
      search: "uns",
      languages: "de",
      limit: 10,
      contentTypes: "content-page",
      fields: "systemdata,metadata",
    });
  });

  it("accepts the bare array returned by older API versions", async () => {
    livingdocsFetch.mockResolvedValue([publication(7, "Kontakt")]);

    const { results } = await call({ q: "kontakt" });
    expect(results.map((r) => r.documentId)).toEqual(["7"]);
  });

  it("skips publications without a document ID or a title", async () => {
    livingdocsFetch.mockResolvedValue({
      results: [
        publication(1, "Kept"),
        { metadata: { title: "No ID" } },
        { systemdata: { documentId: 2 } },
      ],
    });

    const { results } = await call({ q: "test" });
    expect(results.map((r) => r.title)).toEqual(["Kept"]);
  });

  it.each([undefined, "", " a "])(
    "rejects a query shorter than two characters (%s)",
    async (q) => {
      await expect(call({ q })).rejects.toThrow(
        "Query parameter `q` must be at least 2 characters long",
      );
      expect(livingdocsFetch).not.toHaveBeenCalled();
    },
  );

  it.each`
    limit        | expected
    ${undefined} | ${10}
    ${"25"}      | ${25}
    ${"500"}     | ${100}
    ${"0"}       | ${1}
    ${"abc"}     | ${10}
  `("clamps a limit of $limit to $expected", async ({ limit, expected }) => {
    livingdocsFetch.mockResolvedValue({ results: [] });

    await call({ q: "test", limit });

    expect(livingdocsFetch).toHaveBeenCalledWith(
      "publications/search",
      expect.objectContaining({ limit: expected }),
    );
  });

  it("falls back to German for a locale the CMS tenant does not hold", async () => {
    livingdocsFetch.mockResolvedValue({ results: [] });

    await call({ q: "test", lang: "it" });

    expect(livingdocsFetch).toHaveBeenCalledWith(
      "publications/search",
      expect.objectContaining({ languages: "de" }),
    );
  });
});
