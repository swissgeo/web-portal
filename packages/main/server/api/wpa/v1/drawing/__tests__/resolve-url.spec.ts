import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let queryParams: Record<string, string | undefined> = {};
let runtimeConfig: Record<string, unknown> = {};

(globalThis as Record<string, unknown>).defineEventHandler = (
  fn: (_event: unknown) => unknown,
) => fn;

vi.mock("h3", () => ({
  getQuery: (_event: unknown) => queryParams,
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

mockNuxtImport("useRuntimeConfig", () => () => runtimeConfig);

const handler = (await import("../resolve-url")).default as (
  _event: unknown,
) => Promise<unknown>;

beforeEach(() => {
  queryParams = {};
  runtimeConfig = {
    public: {
      drawingAllowedDomains: [
        "s.geo.admin.ch",
        "public.geo.admin.ch",
        "map.geo.admin.ch",
        "sys-s.dev.bgdi.ch",
        "sys-public.dev.bgdi.ch",
      ],
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/wpa/v1/drawing/resolve-url", () => {
  it("returns the resolved redirect URL", async () => {
    queryParams = { url: "https://s.geo.admin.ch/test123" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 301,
        headers: {
          get: (name: string) =>
            name === "Location"
              ? "https://sys-map.dev.bgdi.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/abc123"
              : null,
        },
      }),
    );

    const result = (await handler({})) as { redirectUrl: string };

    expect(fetch).toHaveBeenCalledWith("https://s.geo.admin.ch/test123", {
      redirect: "manual",
    });
    expect(result.redirectUrl).toBe(
      "https://sys-map.dev.bgdi.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/abc123",
    );
  });

  it("resolves relative Location headers", async () => {
    queryParams = { url: "https://s.geo.admin.ch/test123" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 301,
        headers: {
          get: (name: string) =>
            name === "Location" ? "/api/kml/files/abc123" : null,
        },
      }),
    );

    const result = (await handler({})) as { redirectUrl: string };

    expect(result.redirectUrl).toBe(
      "https://s.geo.admin.ch/api/kml/files/abc123",
    );
  });

  it("throws 400 when URL parameter is missing", async () => {
    queryParams = {};

    await expect(handler({})).rejects.toThrow(/URL parameter is required/);
  });

  it("throws 404 when no redirect is found", async () => {
    queryParams = { url: "https://s.geo.admin.ch/no-redirect" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: () => null,
        },
      }),
    );

    await expect(handler({})).rejects.toThrow(/No redirect found/);
  });

  it("throws 500 when fetch fails", async () => {
    queryParams = { url: "https://s.geo.admin.ch/test123" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    await expect(handler({})).rejects.toThrow(/Network error/);
  });

  it("follows 302 redirects", async () => {
    queryParams = { url: "https://s.geo.admin.ch/test123" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 302,
        headers: {
          get: (name: string) =>
            name === "Location" ? "https://example.com/final" : null,
        },
      }),
    );

    const result = (await handler({})) as { redirectUrl: string };

    expect(result.redirectUrl).toBe("https://example.com/final");
  });

  it("throws 403 when URL domain is not in whitelist", async () => {
    queryParams = { url: "https://evil.com/malicious" };

    await expect(handler({})).rejects.toThrow(
      /Fetching from this domain is not allowed/,
    );
  });

  it("allows URLs from whitelisted domains", async () => {
    queryParams = { url: "https://s.geo.admin.ch/test123" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 301,
        headers: {
          get: (name: string) =>
            name === "Location" ? "https://example.com/final" : null,
        },
      }),
    );

    const result = (await handler({})) as { redirectUrl: string };

    expect(result.redirectUrl).toBe("https://example.com/final");
  });

  it("allows URLs from dev domains", async () => {
    queryParams = { url: "https://sys-s.dev.bgdi.ch/test123" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 301,
        headers: {
          get: (name: string) =>
            name === "Location"
              ? "https://sys-public.dev.bgdi.ch/api/kml/files/abc"
              : null,
        },
      }),
    );

    const result = (await handler({})) as { redirectUrl: string };

    expect(result.redirectUrl).toBe(
      "https://sys-public.dev.bgdi.ch/api/kml/files/abc",
    );
  });
});
