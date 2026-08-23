import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock, config } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  config: {
    livingdocsApiEndpoint: "https://cms.example.test/api/2025-03",
    livingdocsAuthToken: "a-token",
  },
}));

mockNuxtImport("$fetch", () => fetchMock);
mockNuxtImport("useRuntimeConfig", () => () => config);

const { livingdocsFetch, resolveLivingdocsLanguage } =
  await import("../livingdocs");

beforeEach(() => {
  fetchMock.mockReset();
  config.livingdocsApiEndpoint = "https://cms.example.test/api/2025-03";
  config.livingdocsAuthToken = "a-token";
});

describe("resolveLivingdocsLanguage", () => {
  it.each`
    lang         | expected
    ${"de"}      | ${"de"}
    ${"fr"}      | ${"fr"}
    ${"en"}      | ${"de"}
    ${"it"}      | ${"de"}
    ${"rm"}      | ${"de"}
    ${undefined} | ${"de"}
  `(
    "resolves $lang to $expected, the tenant only holding de and fr",
    ({ lang, expected }) => {
      expect(resolveLivingdocsLanguage(lang)).toBe(expected);
    },
  );
});

describe("livingdocsFetch", () => {
  it("joins the path onto the configured endpoint and sends the token", async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await expect(
      livingdocsFetch("publications/search", { search: "geo", limit: 10 }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example.test/api/2025-03/publications/search",
      {
        headers: { Authorization: "Bearer a-token" },
        query: { search: "geo", limit: 10 },
      },
    );
  });

  it("trims the configured values, so a stray newline does not break the URL", async () => {
    config.livingdocsApiEndpoint = " https://cms.example.test/api/2025-03 ";
    config.livingdocsAuthToken = " a-token\n";
    fetchMock.mockResolvedValue({});

    await livingdocsFetch("documents/1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://cms.example.test/api/2025-03/documents/1",
      expect.objectContaining({
        headers: { Authorization: "Bearer a-token" },
      }),
    );
  });

  it.each([
    ["endpoint", "livingdocsApiEndpoint"],
    ["token", "livingdocsAuthToken"],
  ] as const)(
    "fails with 503 rather than calling the CMS when the %s is missing",
    async (_label, key) => {
      config[key] = "";

      await expect(
        livingdocsFetch("publications/search"),
      ).rejects.toMatchObject({ statusCode: 503 });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("turns an upstream failure into a 502", async () => {
    fetchMock.mockRejectedValue(new Error("gateway exploded"));

    await expect(livingdocsFetch("publications/search")).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});
