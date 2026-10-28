import { flushPromises } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ref } from "vue";

import type { Distribution } from "@/types/Records";

import { useGeoJson } from "../useGeoJson";

const DATA_URL = "https://example.com/data.geojson";
const STYLE_URL = "https://example.com/style.maplibre.json";

const sampleGeoJson = { type: "FeatureCollection", features: [] as unknown[] };
const sampleStyle = { version: 8, sources: {}, layers: [] as unknown[] };
const sampleIcon = {
  name: "sg-triangle-12-#808080-#FFFFFF-1",
  shape: "triangle",
  radius: 12,
};
const samplePayload = { style: sampleStyle, icons: [sampleIcon] };

const handlers = [
  http.get(DATA_URL, () => {
    return HttpResponse.json(sampleGeoJson);
  }),
  http.get(STYLE_URL, () => {
    return HttpResponse.json(samplePayload);
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function makeDistribution(links: Distribution["links"]): Distribution {
  return {
    id: "test",
    links,
    properties: { type: "Distribution", title: "Test" },
  };
}

describe("useGeoJson composable", () => {
  it("reports no error while the distribution is still loading", async () => {
    const distribution = ref<Distribution | null>(null);
    const { error, mapLibreStyle } = useGeoJson(distribution);

    await flushPromises();
    expect(error.value).toBeNull();
    expect(mapLibreStyle.value).toBeNull();
  });

  it("reports an error when the distribution has no links", async () => {
    const distribution = ref<Distribution | null>(makeDistribution(undefined));
    const { error } = useGeoJson(distribution);

    await flushPromises();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("styledBy");
  });

  it("reports an error when no styledBy link is present", async () => {
    const distribution = ref<Distribution | null>(
      makeDistribution([{ href: DATA_URL, rel: "data" }]),
    );
    const { error, geoJsonData } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toEqual(sampleGeoJson);
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("no styledBy link");
  });

  it("reports an error when no data link is present", async () => {
    const distribution = ref<Distribution | null>(
      makeDistribution([{ href: STYLE_URL, rel: "styledBy" }]),
    );
    const { geoJsonData, mapLibreStyle, error } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toBeNull();
    expect(mapLibreStyle.value).toEqual(sampleStyle);
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("no data link");
  });

  it("fetches the style payload from the styledBy link (case-insensitive rel)", async () => {
    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledBy" },
      ]),
    );
    const { mapLibreStyle, mapLibreIcons, error } = useGeoJson(distribution);

    await flushPromises();
    expect(mapLibreStyle.value).toEqual(sampleStyle);
    expect(mapLibreIcons.value).toEqual([sampleIcon]);
    expect(error.value).toBeNull();
  });

  it("fetches data and style payload together", async () => {
    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledby" },
      ]),
    );
    const { geoJsonData, mapLibreStyle, mapLibreIcons, error } =
      useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toEqual(sampleGeoJson);
    expect(mapLibreStyle.value).toEqual(sampleStyle);
    expect(mapLibreIcons.value).toEqual([sampleIcon]);
    expect(error.value).toBeNull();
  });

  it("falls back to the about link when no data link is present", async () => {
    const distribution = ref<Distribution | null>(
      makeDistribution([
        {
          href: DATA_URL,
          rel: "about",
          type: "application/geo+json",
          title: "Link to GeoJSON file",
        },
        { href: STYLE_URL, rel: "styledby" },
      ]),
    );
    const { geoJsonData, mapLibreStyle, error } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toEqual(sampleGeoJson);
    expect(mapLibreStyle.value).toEqual(sampleStyle);
    expect(error.value).toBeNull();
  });

  it("ignores an about link that is not GeoJSON media", async () => {
    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "about", type: "text/html" },
        { href: STYLE_URL, rel: "styledby" },
      ]),
    );
    const { geoJsonData, error } = useGeoJson(distribution);

    await flushPromises();
    expect(geoJsonData.value).toBeNull();
    // the non-GeoJSON about link is ignored, leaving no usable data link
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("no data link");
  });

  it("reports an error when the style fetch fails", async () => {
    server.use(
      http.get(STYLE_URL, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledBy" },
      ]),
    );
    const { error } = useGeoJson(distribution);

    await flushPromises();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("Unable to load GeoJSON style");
  });

  it("reports an error when the payload has no style key", async () => {
    server.use(
      http.get(STYLE_URL, () => {
        return HttpResponse.json({ icons: [] });
      }),
    );

    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledBy" },
      ]),
    );
    const { error } = useGeoJson(distribution);

    await flushPromises();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("malformed");
  });

  it("reports an error when the style is not a valid MapLibre style document", async () => {
    server.use(
      http.get(STYLE_URL, () => {
        return HttpResponse.json({ style: {}, icons: [] });
      }),
    );

    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledBy" },
      ]),
    );
    const { mapLibreStyle, error } = useGeoJson(distribution);

    await flushPromises();
    expect(mapLibreStyle.value).toBeNull();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("malformed");
  });

  it("defaults to an empty icons array when the payload omits icons", async () => {
    server.use(
      http.get(STYLE_URL, () => {
        return HttpResponse.json({ style: sampleStyle });
      }),
    );

    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledBy" },
      ]),
    );
    const { mapLibreIcons, mapLibreStyle, error } = useGeoJson(distribution);

    await flushPromises();
    expect(mapLibreStyle.value).toEqual(sampleStyle);
    expect(mapLibreIcons.value).toEqual([]);
    expect(error.value).toBeNull();
  });

  it("reports an error when the data fetch fails", async () => {
    server.use(
      http.get(DATA_URL, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const distribution = ref<Distribution | null>(
      makeDistribution([
        { href: DATA_URL, rel: "data" },
        { href: STYLE_URL, rel: "styledby" },
      ]),
    );
    const { error } = useGeoJson(distribution);

    await flushPromises();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toContain("Unable to load GeoJSON data");
  });
});
