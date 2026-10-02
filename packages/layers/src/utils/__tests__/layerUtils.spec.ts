import type { Dataset } from "@swissgeo/ogc";

import { omit } from "es-toolkit/object";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getInfoFromDataset,
  grabFeatureInfoInformation,
  InvalidDatasetError,
  makeServerLayer,
  validateDataset,
} from "@/utils/layerUtils";

describe("Testing the information gathering from datasets", () => {
  it("returns dataset.id when properties are undefined", async () => {
    // @ts-expect-error Intentionally not defining properties
    const dataset: Dataset = {
      id: "dataset-1",
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "dataset-1",
    });
  });

  it("returns dataset.id when title is missing", async () => {
    const dataset: Dataset = {
      id: "dataset-2",
      // @ts-expect-error we are willingly sending a faulty dataset here to test
      // the safety feature.
      properties: {},
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "dataset-2",
    });
  });

  it("returns displayName from properties.title", async () => {
    const dataset: Dataset = {
      id: "dataset-3",
      properties: {
        title: "Layer Title",
        type: "Dataset",
      },
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "Layer Title",
      abstract: undefined,
    });
  });

  it("includes attribution when provided", async () => {
    const dataset: Dataset = {
      id: "dataset-4",
      properties: {
        title: "Layer Title",
        attribution: "SwissGeo",
        type: "Dataset",
      },
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "Layer Title",
      attribution: {
        title: "SwissGeo",
      },
      abstract: undefined,
    });
  });

  it("prioritizes first contact organisation over attribution", async () => {
    const dataset: Dataset = {
      id: "dataset-contacts-priority",
      properties: {
        title: "Layer Title",
        attribution: "SwissGeo",
        contacts: [
          {
            country: "CH",
            role: "pointOfContact",
            organization: "Federal Office of Topography",
          },
        ],
        type: "Dataset",
      },
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "Layer Title",
      attribution: {
        title: "Federal Office of Topography",
      },
      abstract: undefined,
    });
  });

  it("falls back to properties.attribution when first contact organisation is blank", async () => {
    const dataset: Dataset = {
      id: "dataset-contact-blank",
      properties: {
        title: "Layer Title",
        attribution: "SwissGeo fallback",
        contacts: [
          {
            country: "CH",
            role: "pointOfContact",
            organization: "   ",
          },
        ],
        type: "Dataset",
      },
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "Layer Title",
      attribution: {
        title: "SwissGeo fallback",
      },
      abstract: undefined,
    });
  });

  it("includes abstract when description is provided", async () => {
    const dataset: Dataset = {
      id: "dataset-5",
      properties: {
        title: "Layer Title",
        description: "Layer description",
        type: "Dataset",
      },
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "Layer Title",
      abstract: "Layer description",
    });
  });

  it("includes displayName, attribution and abstract together", async () => {
    const dataset: Dataset = {
      id: "dataset-6",
      properties: {
        title: "Layer Title",
        attribution: "SwissGeo",
        description: "Layer description",
        type: "Dataset",
      },
    };

    const result = await getInfoFromDataset(dataset);

    expect(result).toEqual({
      displayName: "Layer Title",
      attribution: {
        title: "SwissGeo",
      },
      abstract: "Layer description",
    });
  });
});

describe("testing the makeServerLayer function", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "mock-uuid-with-extra-step",
    );
  });

  const baseDataset: Dataset = {
    id: "dataset-1",
    properties: {
      title: "Layer Title",
      attribution: "SwissGeo",
      description: "Layer description",
      type: "Dataset",
    },
    links: [
      {
        rel: "self",
        href: "link-to-self",
      },
    ],
  };

  // I would've like to add a "non valid type" but the function assume we get
  // a correct type, and thus has no protection.
  it("creates a layer with the correct defaults", async () => {
    const layer = await makeServerLayer(baseDataset);
    expect(layer.isLoading).toEqual(false);
  });

  it("overrides defaults with options", async () => {
    const layer = await makeServerLayer(baseDataset, {
      isLoading: true,
    });

    expect(layer.isLoading).toBe(true);
  });

  it("extracts the layerURL from the dataset correctly", async () => {
    const layer = await makeServerLayer(baseDataset);
    expect(layer.layerUrl).toEqual("link-to-self");
  });

  it("throws an error when there are no links in the dataset", async () => {
    const faultyDataset = omit(baseDataset, ["links"]);
    await expect(makeServerLayer(faultyDataset)).rejects.toThrow(
      InvalidDatasetError,
    );
  });

  it("throws an error when there is no self-links in the dataset", async () => {
    const faultyDataset = {
      ...baseDataset,
      links: [
        {
          rel: "distributions",
          href: "link",
        },
      ],
    };
    await expect(makeServerLayer(faultyDataset)).rejects.toThrow(
      InvalidDatasetError,
    );
  });
});

describe("grabFeatureInfoInformation", () => {
  const DISTRIBUTIONS_URL = "https://example.test/distributions";
  const WMS_FEATUREINFO_URL = "https://example.test/ds:wms/featureinfo";
  const WMTS_FEATUREINFO_URL = "https://example.test/ds:wmts/featureinfo";
  const DATASERVICE_URL = "https://example.test/dataservice";
  const DESCRIBES_URL = "https://example.test/wms-capabilities";

  const fetchSpy = vi.fn();

  /**
   * Routes fetch by URL: each entry answers with a 200 body. Any URL without
   * a route rejects, so unexpected requests fail loudly instead of hanging.
   */
  function stubFetchRouting(routes: Record<string, unknown>): void {
    fetchSpy.mockImplementation((url: RequestInfo | URL) => {
      const key = String(url);
      if (!(key in routes)) {
        return Promise.reject(new Error(`unexpected fetch: ${key}`));
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve(routes[key]),
      } as Response);
    });
  }

  /**
   * A distributions collection whose first (`:wms`) and preferred (`:wmts`)
   * entries each expose a distinct featureinfo link, so tests can tell which
   * one was followed.
   */
  const distributionCollection = () => ({
    type: "FeatureCollection",
    features: [
      {
        id: "ch.test.layer:wms",
        properties: { type: "Distribution", protocol: "ogc:wms" },
        links: [{ rel: "featureinfo", href: WMS_FEATUREINFO_URL }],
      },
      {
        id: "ch.test.layer:wmts",
        properties: { type: "Distribution", protocol: "ogc:wmts" },
        links: [{ rel: "featureinfo", href: WMTS_FEATUREINFO_URL }],
      },
    ],
  });

  const featureInfoFeature = (dataServiceHref?: string) => ({
    properties: { type: "FeatureInfo", protocol: "ogc:wms" },
    links: dataServiceHref
      ? [{ rel: "dataservice", href: dataServiceHref }]
      : [],
  });

  const dataServiceFeature = (rels: string[]) => ({
    properties: { type: "DataService" },
    links: rels.map((rel) => ({ rel, href: `${DESCRIBES_URL}/${rel}` })),
  });

  function makeDataset(
    overrides: Partial<Dataset> = {},
    preferredDistributionId?: string,
  ): Dataset {
    return {
      id: "ch.test.layer",
      properties: { type: "Dataset", title: "Layer", preferredDistributionId },
      links: [{ rel: "distributions", href: DISTRIBUTIONS_URL }],
      ...overrides,
    };
  }

  beforeEach(() => {
    fetchSpy.mockReset();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("walks the full chain and returns protocol and describes baseUrl", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["describes"]),
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/describes`,
    });
  });

  it("follows the preferred distribution's featureinfo link when one is set", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMTS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["describes"]),
    });

    const info = await grabFeatureInfoInformation(
      makeDataset(undefined, "ch.test.layer:wmts"),
    );

    expect(info).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/describes`,
    });
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      DISTRIBUTIONS_URL,
      WMTS_FEATUREINFO_URL,
      DATASERVICE_URL,
    ]);
  });

  it("falls back to the first distribution when the preferred id matches none", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["describes"]),
    });

    await grabFeatureInfoInformation(
      makeDataset(undefined, "ch.test.layer:nosuch"),
    );

    expect(String(fetchSpy.mock.calls[1]![0])).toBe(WMS_FEATUREINFO_URL);
  });

  it("prefers describes over describedby and about", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature([
        "about",
        "describedby",
        "describes",
      ]),
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/describes`,
    });
  });

  it("falls back to describedby when no describes link exists", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["describedby", "about"]),
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/describedby`,
    });
  });

  it("falls back to about when neither describes nor describedby exist", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["about"]),
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/about`,
    });
  });

  it("matches the rels of every hop case-insensitively", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["Describes"]),
    });
    const dataset = makeDataset({
      links: [{ rel: "Distributions", href: DISTRIBUTIONS_URL }],
    });

    const info = await grabFeatureInfoInformation(dataset);

    // the rel matching is case-insensitive, but the href is returned verbatim
    expect(info).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/Describes`,
    });
  });

  it("returns undefined without fetching when the dataset has no distributions link", async () => {
    const info = await grabFeatureInfoInformation(
      makeDataset({
        links: [{ rel: "self", href: "https://example.test/self" }],
      }),
    );

    expect(info).toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns undefined when the distributions fetch answers non-200", async () => {
    fetchSpy.mockResolvedValue({ status: 404 } as Response);

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toBeUndefined();
  });

  it("returns undefined when the chosen distribution has no featureinfo link", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: {
        type: "FeatureCollection",
        features: [
          {
            id: "ch.test.layer:wms",
            properties: { type: "Distribution", protocol: "ogc:wms" },
            links: [{ rel: "self", href: "https://example.test/self" }],
          },
        ],
      },
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when the featureinfo fetch answers non-200", async () => {
    stubFetchRouting({ [DISTRIBUTIONS_URL]: distributionCollection() });
    fetchSpy.mockImplementation((url: RequestInfo | URL) =>
      String(url) === DISTRIBUTIONS_URL
        ? Promise.resolve({
            status: 200,
            json: () => Promise.resolve(distributionCollection()),
          } as Response)
        : Promise.resolve({ status: 503 } as Response),
    );

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toBeUndefined();
  });

  it("returns undefined when the featureinfo record has no dataservice link", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(),
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("returns undefined when the dataservice fetch answers non-200", async () => {
    fetchSpy.mockImplementation((url: RequestInfo | URL) => {
      if (String(url) === DISTRIBUTIONS_URL) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(distributionCollection()),
        } as Response);
      }
      if (String(url) === WMS_FEATUREINFO_URL) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(featureInfoFeature(DATASERVICE_URL)),
        } as Response);
      }
      return Promise.resolve({ status: 500 } as Response);
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toBeUndefined();
  });

  it("returns undefined with an undefined baseUrl when the dataservice exposes no suitable link", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["self"]),
    });

    const info = await grabFeatureInfoInformation(makeDataset());

    expect(info).toEqual({ protocol: "ogc:wms", baseUrl: undefined });
  });

  it("feeds its result into the layer info via makeServerLayer", async () => {
    stubFetchRouting({
      [DISTRIBUTIONS_URL]: distributionCollection(),
      [WMS_FEATUREINFO_URL]: featureInfoFeature(DATASERVICE_URL),
      [DATASERVICE_URL]: dataServiceFeature(["describes"]),
    });
    const dataset: Dataset = {
      ...makeDataset(),
      links: [
        { rel: "self", href: "https://example.test/self" },
        { rel: "distributions", href: DISTRIBUTIONS_URL },
      ],
    };

    const layer = await makeServerLayer(dataset);

    expect(layer.info?.featureInfoInformation).toEqual({
      protocol: "ogc:wms",
      baseUrl: `${DESCRIBES_URL}/describes`,
    });
  });
});

describe("validateDataset", () => {
  const validDataset: Dataset = {
    id: "dataset-1",
    properties: {
      title: "Layer Title",
      type: "Dataset",
    },
    links: [
      {
        rel: "self",
        href: "link-to-self",
      },
    ],
  };

  it("accepts a well-formed dataset", () => {
    expect(() => validateDataset(validDataset)).not.toThrow();
  });

  it("rejects null", () => {
    expect(() => validateDataset(null)).toThrow(InvalidDatasetError);
  });

  it("rejects undefined", () => {
    expect(() => validateDataset(undefined)).toThrow(InvalidDatasetError);
  });

  it("rejects a string", () => {
    expect(() => validateDataset("not a dataset")).toThrow(InvalidDatasetError);
  });

  it("rejects a dataset with a missing id", () => {
    const faulty = omit(validDataset, ["id"]);
    expect(() => validateDataset(faulty)).toThrow(/id/);
  });

  it("rejects a dataset with an empty id", () => {
    expect(() => validateDataset({ ...validDataset, id: "" })).toThrow(/id/);
  });

  it("rejects a dataset with missing properties", () => {
    const faulty = omit(validDataset, ["properties"]);
    expect(() => validateDataset(faulty)).toThrow(/properties/);
  });

  it('rejects a dataset whose properties.type is not "Dataset"', () => {
    const faulty = {
      ...validDataset,
      properties: { ...validDataset.properties, type: "Distribution" },
    };
    expect(() => validateDataset(faulty)).toThrow(/Dataset/);
  });

  it("rejects a dataset with an empty properties.title", () => {
    const faulty = {
      ...validDataset,
      properties: { ...validDataset.properties, title: "" },
    };
    expect(() => validateDataset(faulty)).toThrow(/title/);
  });

  it("rejects a dataset whose links is not an array", () => {
    const faulty = { ...validDataset, links: "not-an-array" };
    expect(() => validateDataset(faulty)).toThrow(/links/);
  });

  it("rejects a dataset without a self link", () => {
    const faulty = {
      ...validDataset,
      links: [{ rel: "distributions", href: "link" }],
    };
    expect(() => validateDataset(faulty)).toThrow(/self/);
  });
});
