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

const handler = (await import("../[capabilityUrl]")).default as (
  _event: unknown,
) => Promise<unknown>;

interface ServiceResponse {
  id: string;
  links: { href: string; rel: string; type?: string; title?: string }[];
}

beforeEach(() => {
  routerParams.capabilityUrl = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/wpa/v1/layers/external/service/[capabilityUrl]", () => {
  it("decodes the capability URL and returns it as an `about` link", async () => {
    const capabilityUrl = "https://wmts.example.com/1.0.0/WMTSCapabilities.xml";
    routerParams.capabilityUrl = encodeCapabilityUrl(capabilityUrl);

    const result = (await handler({})) as ServiceResponse;

    expect(result.id).toBe(capabilityUrl);
    const aboutLink = result.links.find((l) => l.rel === "about");
    expect(aboutLink?.href).toBe(capabilityUrl);
    expect(aboutLink?.type).toBe("application/xml");
  });

  it("throws 400 when the capability URL is missing", () => {
    routerParams.capabilityUrl = undefined;

    expect(() => handler({})).toThrow(/Capability URL cannot be determined/);
  });
});
