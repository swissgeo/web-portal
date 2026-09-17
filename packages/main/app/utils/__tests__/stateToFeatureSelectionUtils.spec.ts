import type { OgcDistribution } from "@swissgeo/feature";
import type { DatasetLayer, Layer as SourceLayer } from "@swissgeo/layers";
import type { Dataset } from "@swissgeo/ogc";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOgcDistribution,
  getUrlTemplate,
} from "@/utils/stateToFeatureSelectionUtils";

const DISTRIBUTIONS_URL = "https://example.test/distributions";
const URL_TEMPLATE = "https://example.test/popup/{featureId}?lang={lang}";

function makeDatasetLayer(
  links: Dataset["links"] = [{ rel: "distributions", href: DISTRIBUTIONS_URL }],
): DatasetLayer {
  return {
    uuid: "layer-1",
    humanId: "ch.test.layer",
    type: "dataset",
    isLoading: false,
    data: { id: "ch.test.layer", links } as unknown as Dataset,
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

const fetchSpy = vi.fn();

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

describe("getUrlTemplate", () => {
  it("returns the preview uri template of a geoadmin:features distribution", () => {
    expect(
      getUrlTemplate({
        layerUuid: "layer-1",
        layerId: "ch.test.layer",
        distribution: identifyDistribution,
      }),
    ).toBe(URL_TEMPLATE);
  });

  it("returns undefined when the source has no distribution", () => {
    expect(
      getUrlTemplate({ layerUuid: "layer-1", layerId: "ch.test.layer" }),
    ).toBeUndefined();
  });
});
