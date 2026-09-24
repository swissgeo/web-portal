import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { encodeCapabilityUrl } from "../../../../../../../utils/externalLayerUrl";

const routerParams: Record<string, string | undefined> = {};

(globalThis as Record<string, unknown>).defineEventHandler = (
  fn: (_event: unknown) => unknown,
) => fn;

vi.mock("h3", () => ({
  getRouterParam: (_event: unknown, name: string) => routerParams[name],
  appendResponseHeader: vi.fn(),
  createError: (opts: {
    status: number;
    statusMessage?: string;
    message?: string;
  }) => {
    const err = new Error(
      opts.message ?? opts.statusMessage ?? "error",
    ) as Error & {
      status?: number;
    };
    err.status = opts.status;
    return err;
  },
}));

const handler = (await import("../[layerId]")).default as (
  _event: unknown,
) => Promise<unknown>;

interface DistributionsResponse {
  type: string;
  links: unknown[];
  records?: unknown[];
  features: {
    id: string;
    links: { href: string; rel: string }[];
    properties: {
      title: string;
      type: string;
      protocol: string;
      externalIds: string[];
    };
  }[];
}

beforeEach(() => {
  routerParams.capabilityUrl = undefined;
  routerParams.layerId = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/wpa/v1/layers/external/[capabilityUrl]/[layerId]", () => {
  // Guards GPS-804: the datamapping pipeline (useGenericOgcData) reads a
  // FeatureCollection's `features`. Returning a `records` collection here left
  // `.features` undefined, so the layer silently never rendered.
  it("returns a FeatureCollection with `features`, not a `records` collection", async () => {
    routerParams.capabilityUrl = encodeCapabilityUrl(
      "https://wmts.example.com/1.0.0/WMTSCapabilities.xml",
    );
    routerParams.layerId = "my-layer";

    const result = (await handler({})) as DistributionsResponse;

    expect(result.type).toBe("FeatureCollection");
    expect(Array.isArray(result.features)).toBe(true);
    expect(result.features).toHaveLength(1);
    expect(result.records).toBeUndefined();
  });

  // Guards GPS-804: useService resolves the service via getDataServiceLinks,
  // i.e. rel "dataservice" — not "service". The wrong rel left the capability
  // URL null and the layer got no endpoint.
  it("exposes the service through a `dataservice` link pointing at the service route", async () => {
    const encoded = encodeCapabilityUrl(
      "https://wmts.example.com/1.0.0/WMTSCapabilities.xml",
    );
    routerParams.capabilityUrl = encoded;
    routerParams.layerId = "my-layer";

    const result = (await handler({})) as DistributionsResponse;
    const feature = result.features[0]!;

    const serviceLink = feature.links.find((l) => l.rel === "dataservice");
    expect(serviceLink).toBeDefined();
    expect(serviceLink?.href).toBe(
      `/api/wpa/v1/layers/external/service/${encoded}`,
    );
    expect(feature.links.some((l) => l.rel === "service")).toBe(false);
  });

  it("carries the layer id and Distribution metadata in the feature", async () => {
    routerParams.capabilityUrl = encodeCapabilityUrl(
      "https://wmts.example.com/1.0.0/WMTSCapabilities.xml",
    );
    routerParams.layerId = "my-layer";

    const result = (await handler({})) as DistributionsResponse;
    const feature = result.features[0]!;

    expect(feature.id).toBe("my-layer");
    expect(feature.properties.title).toBe("my-layer");
    expect(feature.properties.type).toBe("Distribution");
    expect(feature.properties.externalIds).toEqual(["my-layer"]);
  });

  it("detects the WMTS protocol from the capability URL", async () => {
    routerParams.capabilityUrl = encodeCapabilityUrl(
      "https://wmts.example.com/1.0.0/WMTSCapabilities.xml",
    );
    routerParams.layerId = "my-layer";

    const result = (await handler({})) as DistributionsResponse;

    expect(result.features[0]!.properties.protocol).toBe("OGC:WMTS");
  });

  it("detects the WMS protocol from the capability URL", async () => {
    routerParams.capabilityUrl = encodeCapabilityUrl(
      "https://wms.example.com/?SERVICE=WMS",
    );
    routerParams.layerId = "my-layer";

    const result = (await handler({})) as DistributionsResponse;

    expect(result.features[0]!.properties.protocol).toBe("OGC:WMS");
  });

  it("throws 400 when the capability URL or layer id is missing", () => {
    routerParams.capabilityUrl = encodeCapabilityUrl(
      "https://wmts.example.com/1.0.0/WMTSCapabilities.xml",
    );
    routerParams.layerId = undefined;

    expect(() => handler({})).toThrow(
      /Capability URL and Layer ID are required/,
    );
  });
});
