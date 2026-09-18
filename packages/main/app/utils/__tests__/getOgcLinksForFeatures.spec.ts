import type {
  OgcDistribution,
  OgcDistributionFeature,
} from "@swissgeo/feature";
import type { DatasetLayer, Layer as SourceLayer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import log from "@swissgeo/log";
import {
  getOgcDistribution,
  getOgcFeatureInfo,
  getUrlTemplate,
} from "~/utils/getOgcLinksForFeatures";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@swissgeo/log", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const DISTRIBUTIONS_URL = "https://example.test/distributions";
const URL_TEMPLATE = "https://example.test/popup/{featureId}?lang={lang}";

const FEATUREINFO_URL = "https://example.test/distributions/ch.test.layer:wms";
const PREFERRED_FEATUREINFO_URL =
  "https://example.test/distributions/ch.test.layer:api3features";

function makeDatasetLayer(
  links: Dataset["links"] = [{ rel: "distributions", href: DISTRIBUTIONS_URL }],
  preferredDistributionId?: string,
): DatasetLayer {
  return {
    uuid: "layer-1",
    humanId: "ch.test.layer",
    type: "dataset",
    isLoading: false,
    data: {
      id: "ch.test.layer",
      links,
      properties: { preferredDistributionId },
    } as unknown as Dataset,
  };
}

const identifyDistribution = {
  type: "FeatureCollection",
  features: [
    {
      id: "dist-1",
      properties: { type: "ogc", protocol: "geoadmin:features" },
      linkTemplates: [{ rel: "preview", uriTemplate: URL_TEMPLATE }],
    },
  ],
} as unknown as OgcDistribution;

const identifyFeature = identifyDistribution
  .features[0] as OgcDistributionFeature;

/**
 * A distributions collection where the "preferred" (`:wmts`) and the first
 * (`:wms`) entries each expose a distinct featureinfo link, so tests can tell
 * which one was followed.
 */
const collectionWithFeatureInfoLinks = (
  preferredFeatureInfoHref?: string,
): OgcDistribution => ({
  type: "FeatureCollection",
  features: [
    {
      id: "ch.test.layer:wms",
      links: [{ href: FEATUREINFO_URL, rel: "featureinfo" }],
      properties: { type: "distribution", protocol: "ogc:wms" },
    },
    {
      id: "ch.test.layer:wmts",
      links: [
        {
          href: preferredFeatureInfoHref ?? PREFERRED_FEATUREINFO_URL,
          rel: "featureinfo",
        },
      ],
      properties: { type: "distribution", protocol: "ogc:wmts" },
    },
  ],
});

const geoadminFeatureInfoFeature = {
  id: "ch.test.layer:api3features",
  properties: { type: "distribution", protocol: "geoadmin:features" },
  linkTemplates: [{ rel: "preview", uriTemplate: URL_TEMPLATE }],
} as unknown as OgcDistributionFeature;

const fetchSpy = vi.fn();

/**
 * Routes fetch by URL: each entry answers with a 200/ok body. Any URL without
 * a route rejects, so unexpected requests fail loudly instead of hanging.
 */
function stubFetchRouting(routes: Record<string, unknown>): void {
  fetchSpy.mockImplementation((url: RequestInfo | URL) => {
    const key = String(url);
    if (!(key in routes)) {
      return Promise.reject(new Error(`unexpected fetch: ${key}`));
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(routes[key]),
    } as Response);
  });
}

describe("getOgcDistribution", () => {
  beforeEach(() => {
    fetchSpy.mockReset();
    fetchSpy.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(identifyDistribution),
      } as Response),
    );
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the distributions link of a dataset layer and returns the parsed body", async () => {
    const distribution = await getOgcDistribution(makeDatasetLayer());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]![0]).toBe(DISTRIBUTIONS_URL);
    expect(distribution).toEqual(identifyDistribution);
  });

  it("forwards the given abort signal into the fetch call", async () => {
    const controller = new AbortController();

    await getOgcDistribution(makeDatasetLayer(), controller.signal);

    expect(fetchSpy).toHaveBeenCalledWith(DISTRIBUTIONS_URL, {
      signal: controller.signal,
    });
  });

  it("returns undefined when the fetch answers not-ok", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve({ ok: false } as Response),
    );

    await expect(getOgcDistribution(makeDatasetLayer())).resolves.toBe(
      undefined,
    );
  });

  it("returns undefined when the fetch rejects (e.g. aborted)", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.reject(new DOMException("The operation was aborted.")),
    );

    await expect(getOgcDistribution(makeDatasetLayer())).resolves.toBe(
      undefined,
    );
  });

  it("does not fetch for layers that are not datasets", async () => {
    const fileLayer = {
      uuid: "layer-2",
      humanId: "some.kml",
      type: "kml",
      isLoading: false,
      data: "<kml/>",
    } as unknown as SourceLayer;

    await expect(getOgcDistribution(fileLayer)).resolves.toBe(undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch when the dataset has no distributions link", async () => {
    await expect(
      getOgcDistribution(
        makeDatasetLayer([{ rel: "self", href: "https://example.test/self" }]),
      ),
    ).resolves.toBe(undefined);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("matches the distributions link case-insensitively", async () => {
    await getOgcDistribution(
      makeDatasetLayer([{ rel: "Distributions", href: DISTRIBUTIONS_URL }]),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe("getOgcFeatureInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the featureinfo link of the preferred distribution and returns the resolved feature", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
      [PREFERRED_FEATUREINFO_URL]: geoadminFeatureInfoFeature,
    });

    const feature = await getOgcFeatureInfo(
      makeDatasetLayer(undefined, "ch.test.layer:wmts"),
    );

    expect(feature).toEqual(geoadminFeatureInfoFeature);
    // distributions collection first, then the preferred distribution's link
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      DISTRIBUTIONS_URL,
      PREFERRED_FEATUREINFO_URL,
    ]);
  });

  it("falls back to the first distribution when the dataset has no preferredDistributionId", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
      [FEATUREINFO_URL]: geoadminFeatureInfoFeature,
    });

    const feature = await getOgcFeatureInfo(makeDatasetLayer());

    expect(feature).toEqual(geoadminFeatureInfoFeature);
    expect(String(fetchSpy.mock.calls[1]![0])).toBe(FEATUREINFO_URL);
  });

  it("falls back to the first distribution when the preferred id matches no feature", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
      [FEATUREINFO_URL]: geoadminFeatureInfoFeature,
    });

    const feature = await getOgcFeatureInfo(
      makeDatasetLayer(undefined, "ch.test.layer:nosuch"),
    );

    expect(feature).toEqual(geoadminFeatureInfoFeature);
    expect(String(fetchSpy.mock.calls[1]![0])).toBe(FEATUREINFO_URL);
  });

  it("falls back to the first distribution when the dataset record has no properties at all", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
      [FEATUREINFO_URL]: geoadminFeatureInfoFeature,
    });
    const layer = {
      ...makeDatasetLayer(),
      data: {
        id: "ch.test.layer",
        links: [{ rel: "distributions", href: DISTRIBUTIONS_URL }],
      } as unknown as Dataset,
    };

    const feature = await getOgcFeatureInfo(layer);

    expect(feature).toEqual(geoadminFeatureInfoFeature);
    expect(String(fetchSpy.mock.calls[1]![0])).toBe(FEATUREINFO_URL);
  });

  it("picks the first featureinfo link when several are present", async () => {
    const collection = collectionWithFeatureInfoLinks();
    const firstFeatureInfoUrl = "https://example.test/another-featureinfo";
    collection.features[0]!.links!.unshift({
      href: firstFeatureInfoUrl,
      rel: "featureinfo",
    });
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collection,
      [firstFeatureInfoUrl]: geoadminFeatureInfoFeature,
      [FEATUREINFO_URL]: geoadminFeatureInfoFeature,
    });

    await getOgcFeatureInfo(makeDatasetLayer());

    expect(String(fetchSpy.mock.calls[1]![0])).toBe(firstFeatureInfoUrl);
  });

  it("warns and returns undefined when there is no distribution at all", async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve({ ok: false } as Response),
    );

    await expect(
      getOgcFeatureInfo(makeDatasetLayer()),
    ).resolves.toBeUndefined();
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("warns and returns undefined when the distribution collection is empty", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: { type: "FeatureCollection", features: [] },
    });

    await expect(
      getOgcFeatureInfo(makeDatasetLayer()),
    ).resolves.toBeUndefined();
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("warns and returns undefined when no featureinfo link exists", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: {
        type: "FeatureCollection",
        features: [
          {
            id: "ch.test.layer:wms",
            links: [{ href: "https://example.test/self", rel: "self" }],
            properties: { type: "distribution", protocol: "ogc:wms" },
          },
        ],
      },
    });

    await expect(
      getOgcFeatureInfo(makeDatasetLayer()),
    ).resolves.toBeUndefined();
    expect(log.warn).toHaveBeenCalledTimes(1);
    // no second fetch: nothing to follow
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("logs an error and returns undefined when the featureinfo endpoint is not reachable", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
    });
    fetchSpy.mockImplementation((url: RequestInfo | URL) => {
      if (String(url) === DISTRIBUTIONS_URL) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(collectionWithFeatureInfoLinks()),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 503 } as Response);
    });

    await expect(
      getOgcFeatureInfo(makeDatasetLayer()),
    ).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for protocols other than geoadmin:features and ogc:wms", async () => {
    const wmtsFeatureInfoFeature = {
      id: "ch.test.layer:wmts",
      properties: { type: "distribution", protocol: "ogc:wmts" },
    } as unknown as OgcDistributionFeature;
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
      [FEATUREINFO_URL]: wmtsFeatureInfoFeature,
    });

    await expect(
      getOgcFeatureInfo(makeDatasetLayer()),
    ).resolves.toBeUndefined();
  });

  it("forwards the abort signal into the featureinfo fetch", async () => {
    const controller = new AbortController();
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: collectionWithFeatureInfoLinks(),
      [FEATUREINFO_URL]: geoadminFeatureInfoFeature,
    });

    await getOgcFeatureInfo(makeDatasetLayer(), controller.signal);

    expect(fetchSpy).toHaveBeenLastCalledWith(FEATUREINFO_URL, {
      signal: controller.signal,
    });
  });
});

describe("getUrlTemplate", () => {
  it("returns the preview uri template of a geoadmin:features distribution feature", () => {
    expect(
      getUrlTemplate({
        layerUuid: "layer-1",
        layerId: "ch.test.layer",
        distributionFeature: identifyFeature,
      }),
    ).toBe(URL_TEMPLATE);
  });

  it("returns undefined when the source has no distribution feature", () => {
    expect(
      getUrlTemplate({ layerUuid: "layer-1", layerId: "ch.test.layer" }),
    ).toBeUndefined();
  });
});
