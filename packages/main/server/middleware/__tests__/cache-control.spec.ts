import { describe, expect, it, vi } from "vitest";

(globalThis as Record<string, unknown>).defineEventHandler = (
  fn: (_event: unknown) => unknown,
) => fn;

vi.mock("h3", () => ({
  getMethod: (event: { method: string }) => event.method,
  getResponseHeader: (
    event: { headers: Record<string, unknown> },
    name: string,
  ) => event.headers[name],
  setResponseHeader: (
    event: { headers: Record<string, unknown> },
    name: string,
    value: string,
  ) => {
    event.headers[name] = value;
  },
}));

const middleware = (await import("../cache-control")).default as (
  _event: unknown,
) => void;

const call = (method: string, existingHeader?: string) => {
  const event = {
    method,
    headers: existingHeader
      ? { "Cache-Control": existingHeader }
      : ({} as Record<string, string>),
  };
  middleware(event);
  return event.headers["Cache-Control"];
};

describe("cache-control middleware", () => {
  it("caches GET responses for 5 minutes", () => {
    expect(call("GET")).toBe("public, max-age=300");
  });

  it("treats HEAD like GET", () => {
    expect(call("HEAD")).toBe("public, max-age=300");
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "does not cache %s responses",
    (method) => {
      expect(call(method)).toBe("no-store");
    },
  );

  it.each(["public, max-age=300", "no-cache", "no-store"])(
    "leaves the existing header %s untouched",
    (existing) => {
      expect(call("GET", existing)).toBe(existing);
    },
  );
});
