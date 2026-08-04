import type { Style } from "mapbox-gl";

import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Distribution } from "@/types";

import { extractStyleUrl, useStyle } from "../useStyle";
import distributionJson from "./fixtures/distribution_ch.bafu.schutzgebiete-luftfahrt_wmts.json";

const distributionFixture = distributionJson as Distribution;
const fixtureStyleUrl =
  "https://services.dev.sgdi.tech/api/oas/rc1/styles/ch.bafu.schutzgebiete-luftfahrt:wmts:style";
const mockStyleUrl = "https://styles.example.test/style.json";
const fetchDistributionFixture: Distribution = {
  ...distributionFixture,
  links: distributionFixture.links?.map((link) => ({
    ...link,
    href: link.rel === "styledby" ? mockStyleUrl : link.href,
  })),
};
const style: Style = {
  version: 8,
  sources: {},
  layers: [],
};

const server = setupServer(
  http.get(mockStyleUrl, () => HttpResponse.json(style)),
);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("extractStyleUrl", () => {
  it.each([
    {
      description: "returns null for a null distribution",
      distribution: null,
      expected: null,
    },
    {
      description: "returns null when the distribution has no links",
      distribution: { ...distributionFixture, links: undefined },
      expected: null,
    },
    {
      description: "returns null when the distribution has no styledby link",
      distribution: {
        ...distributionFixture,
        links: distributionFixture.links?.filter(
          (link) => link.rel !== "styledby",
        ),
      },
      expected: null,
    },
    {
      description: "extracts a lowercase styledby link",
      distribution: distributionFixture,
      expected: fixtureStyleUrl,
    },
    {
      description: "extracts an uppercase styledby link",
      distribution: {
        ...distributionFixture,
        links: distributionFixture.links?.map((link) => ({
          ...link,
          rel: link.rel === "styledby" ? "STYLEDBY" : link.rel,
        })),
      },
      expected: fixtureStyleUrl,
    },
  ])("$description", ({ distribution, expected }) => {
    expect(extractStyleUrl(distribution)).toBe(expected);
  });

  it("throws when a styledby link has no href", () => {
    const distribution: Distribution = {
      ...distributionFixture,
      links: [
        // @ts-expect-error Intentionally missing href.
        { rel: "styledby" },
      ],
    };

    expect(() => extractStyleUrl(distribution)).toThrow(
      "Faulty styledby record",
    );
  });
});

describe("useStyle", () => {
  it("fetches Mapbox style data when the distribution becomes available", async () => {
    const distribution = ref<Distribution | null>(null);
    const { styleData, styleDataUrl } = useStyle(distribution);

    expect(styleDataUrl.value).toBe(null);

    distribution.value = fetchDistributionFixture;
    await flushPromises();

    expect(styleDataUrl.value).toBe(mockStyleUrl);
    expect(styleData.value).toEqual(style);
  });
});
