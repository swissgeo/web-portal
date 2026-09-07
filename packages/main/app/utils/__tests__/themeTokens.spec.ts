import { afterEach, describe, expect, it, vi } from "vitest";

import { readThemeToken } from "@/utils/themeTokens";

describe("readThemeToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads a custom property from the document root", () => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({
        getPropertyValue: (token: string) =>
          token === "--ui-color-primary-600" ? " #06999b \n" : "",
      })),
    );

    expect(readThemeToken("--ui-color-primary-600", "#000000")).toBe("#06999b");
  });

  it("returns the fallback when the token resolves to an empty string", () => {
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => ({ getPropertyValue: () => "" })),
    );

    expect(readThemeToken("--ui-does-not-exist", "#ff0000")).toBe("#ff0000");
  });

  it("returns the fallback when there is no document (SSR)", () => {
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: undefined,
    });

    expect(readThemeToken("--ui-color-primary-600", "#00ff00")).toBe("#00ff00");

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  });
});
