import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Distribution } from "@/types/Records";

import { useGeoJson } from "../useGeoJson";

const DATA_URL = "https://example.com/data.geojson";
const STYLE_URL = "https://example.com/style.json";

const sampleGeoJson = { type: "FeatureCollection", features: [] as any[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
const sampleStyle = { version: 8, sources: {} };

const handlers = [
  http.get(DATA_URL, () => {
    return HttpResponse.json(sampleGeoJson);
  }),
  http.get(STYLE_URL, () => {
    return HttpResponse.json(sampleStyle);
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("useGeoJson", () => {
  it("returns empty parsed objects when distribution has no links", async () => {
    const distribution = ref<Distribution>({
      id: "test",
      links: [],
      properties: { type: "Distribution", title: "Test" },
    });
    const { geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toEqual({
      geoJsonData: {},
      geoJsonStyle: {},
    });
  });

  it("returns null URLs when no matching rel links", async () => {
    const distribution = ref<Distribution>({
      id: "test",
      links: [
        { href: "https://example.com/other", rel: "dataset" },
        { href: "https://example.com/other2", rel: "self" },
      ],
      properties: { type: "Distribution", title: "Test" },
    });
    const { geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toEqual({
      geoJsonData: {},
      geoJsonStyle: {},
    });
  });

  it("fetches geojson data from data link", async () => {
    const distribution = ref<Distribution>({
      id: "test",
      links: [{ href: DATA_URL, rel: "data" }],
      properties: { type: "Distribution", title: "Test" },
    });
    const { geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value.geoJsonData).toEqual(sampleGeoJson);
    expect(geoJsonData.value.geoJsonStyle).toEqual({});
  });

  it("fetches geojson style from styledby link", async () => {
    const distribution = ref<Distribution>({
      id: "test",
      links: [{ href: STYLE_URL, rel: "styledby" }],
      properties: { type: "Distribution", title: "Test" },
    });
    const { geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value.geoJsonData).toEqual({});
    expect(geoJsonData.value.geoJsonStyle).toEqual(sampleStyle);
  });

  it("fetches both data and style URLs", async () => {
    const distribution = ref<Distribution>({
      id: "test",
      links: [
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledby" },
      ],
      properties: { type: "Distribution", title: "Test" },
    });
    const { geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value.geoJsonData).toEqual(sampleGeoJson);
    expect(geoJsonData.value.geoJsonStyle).toEqual(sampleStyle);
  });

  it("returns empty objects when fetch returns empty", async () => {
    server.use(
      http.get(DATA_URL, () => {
        return HttpResponse.text("");
      }),
      http.get(STYLE_URL, () => {
        return HttpResponse.text("");
      }),
    );

    const distribution = ref<Distribution>({
      id: "test",
      links: [
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledby" },
      ],
      properties: { type: "Distribution", title: "Test" },
    });
    const { geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toEqual({
      geoJsonData: {},
      geoJsonStyle: {},
    });
  });
});
