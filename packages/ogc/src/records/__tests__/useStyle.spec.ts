import type { Style } from "mapbox-gl";

import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Distribution, Link } from "@/types";

import { extractStyleUrl, useStyle } from "../useStyle";

const styleUrl = "https://styles.example.test/style.json";
const style: Style = {
  version: 8,
  sources: {},
  layers: [],
};

const server = setupServer(http.get(styleUrl, () => HttpResponse.json(style)));

function makeDistribution(links?: Link[]): Distribution {
  return {
    id: "test-distribution",
    links,
    properties: {
      title: "Test distribution",
      type: "Distribution",
    },
  };
}

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("extractStyleUrl", () => {
  it.each([
    null,
    makeDistribution(),
    makeDistribution([{ href: "https://example.test/data", rel: "data" }]),
  ])("returns null when no style link is available", (distribution) => {
    expect(extractStyleUrl(distribution)).toBe(null);
  });

  it.each(["styledby", "STYLEDBY"])("extracts a %s style link", (rel) => {
    const distribution = makeDistribution([{ href: styleUrl, rel }]);

    expect(extractStyleUrl(distribution)).toBe(styleUrl);
  });

  it("rejects a style link without an href", () => {
    const distribution = makeDistribution([
      // @ts-expect-error Intentionally missing href.
      { rel: "styledby" },
    ]);

    expect(() => extractStyleUrl(distribution)).toThrow(
      "Faulty styledby record",
    );
  });
});

describe("useStyle", () => {
  it("fetches style data when the distribution becomes available", async () => {
    const distribution = ref<Distribution | null>(null);
    const { styleData, styleDataUrl } = useStyle(distribution);

    expect(styleDataUrl.value).toBe(null);

    distribution.value = makeDistribution([
      { href: styleUrl, rel: "styledby" },
    ]);
    await flushPromises();

    expect(styleDataUrl.value).toBe(styleUrl);
    expect(styleData.value).toEqual(style);
  });
});
