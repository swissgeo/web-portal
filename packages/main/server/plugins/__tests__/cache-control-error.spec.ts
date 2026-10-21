import { describe, expect, it, vi } from "vitest";

(globalThis as Record<string, unknown>).defineNitroPlugin = (
  fn: (_app: unknown) => void,
) => fn;

vi.mock("h3", () => ({
  setResponseHeader: (
    event: { headers: Record<string, string> },
    name: string,
    value: string,
  ) => {
    event.headers[name] = value;
  },
}));

type ErrorHandler = (
  _error: Error,
  _context: { event: { headers: Record<string, string> } },
) => void;

const plugin = (await import("../cache-control-error")).default as (_app: {
  hooks: { hook: (_name: string, _handler: ErrorHandler) => void };
}) => void;

const registerErrorHandler = () => {
  const hooks: Record<string, ErrorHandler> = {};
  plugin({
    hooks: {
      hook: (name, handler) => {
        hooks[name] = handler;
      },
    },
  });
  return hooks["error"];
};

describe("cache-control error plugin", () => {
  it("registers an error hook", () => {
    expect(registerErrorHandler()).toBeTypeOf("function");
  });

  it("marks error responses as not cacheable", () => {
    const errorHandler = registerErrorHandler();
    const event = {
      headers: { "Cache-Control": "public, max-age=300" },
    };

    errorHandler!(new Error("not found"), { event });

    expect(event.headers["Cache-Control"]).toBe("no-store");
  });
});
