import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isLocaleRoot,
  isLocalized,
  redirector,
  resolvePreferredLocale,
} from "../redirect.global";

const { navigateToMock, mockHeaders, mockUseRequestHeaders } = vi.hoisted(
  () => {
    const navigateToMock = vi.fn();
    const mockHeaders: Record<string, string | undefined> = {};
    const mockUseRequestHeaders = vi.fn(() => mockHeaders);
    return {
      navigateToMock,
      mockHeaders,
      mockUseRequestHeaders,
    };
  },
);

mockNuxtImport("useNuxtApp", () => () => ({
  $i18n: {
    localeCodes: { value: ["de", "fr", "it", "en", "rm"] },
  },
  payload: {
    state: {
      _layout: "abc",
    },
  },
}));

mockNuxtImport("useLocalePath", () => () => (path: string) => {
  // assuming that path has a leading /
  return `/de${path}`;
});

mockNuxtImport("navigateTo", () => navigateToMock);
mockNuxtImport("useRequestHeaders", () => mockUseRequestHeaders);

describe("redirect plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mockHeaders)) {
      delete mockHeaders[key];
    }
    mockUseRequestHeaders.mockReturnValue(mockHeaders);
    // Neutralize navigator.languages so tests without an explicit
    // Accept-Language exercise the DEFAULT_LOCALE fallback. happy-dom
    // defaults to 'en-US' which now matches a supported locale.
    Object.defineProperty(navigator, "languages", {
      value: [],
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, "language", {
      value: "",
      configurable: true,
      writable: true,
    });
  });

  it.each([
    "/map",
    "/dataset",
    "/map/something",
    "/dataset/uuid/",
    "/map?state=foo",
  ])("detects unlocalized path %s", (path) => {
    const result = isLocalized(path);
    expect(result).toBe(false);
  });

  it.each([
    "/de/map",
    "/fr/dataset",
    "/it/map/something",
    "/de/dataset/uuid/",
    "/fr/map?state=foo",
  ])("detects localized path %s", (path) => {
    const result = isLocalized(path);
    expect(result).toBe(true);
  });

  it.each(["/de", "/fr", "/it"])(
    "correctly detects locale root paths with %s",
    (path) => {
      const result = isLocaleRoot(path);
      expect(result).toBe(true);
    },
  );

  it.each(["/su", "/xx"])(
    "correctly detects if supposed locale root is actually none with %s",
    (path) => {
      const result = isLocaleRoot(path);
      expect(result).toBe(false);
    },
  );

  it.each([
    ["/", "/de/map"],
    ["/de", "/de/map"],
    ["/dataset", "/de/dataset"],
  ])("correctly tries to redirect from %s to %s", async (from, to) => {
    const fromObj = { path: from, query: {} };
    const toObj = { path: to, query: {} };
    await redirector(fromObj);
    expect(navigateToMock).toHaveBeenCalledExactlyOnceWith(toObj, {
      redirectCode: 302,
    });
  });

  it.each(["/de/map", "/de/dataset", "/health"])(
    "does not redirect %s",
    async (from) => {
      const fromObj = { path: from, query: {} };
      await redirector(fromObj);
      expect(navigateToMock).toHaveBeenCalledTimes(0);
    },
  );

  it("preserves the query param on redirect", async () => {
    const fromObj = {
      path: "/de",
      query: {
        param: "1",
      },
    };
    const toObj = { path: "/de/map", query: { param: "1" } };
    await redirector(fromObj);
    expect(navigateToMock).toHaveBeenCalledExactlyOnceWith(toObj, {
      redirectCode: 302,
    });
  });

  it.each(["/api", "/api/wpa/v1/print", "/health"])(
    "skips middleware for server route %s",
    async (serverRoute: string) => {
      const to = { path: serverRoute, query: {} };
      await redirector(to);
      expect(navigateToMock).not.toHaveBeenCalled();
    },
  );

  describe("resolvePreferredLocale", () => {
    it("falls back to the default locale when no signal is present", () => {
      mockHeaders["accept-language"] = "";
      expect(resolvePreferredLocale()).toBe("de");
    });

    it("picks the first matching tag from Accept-Language", () => {
      mockHeaders["accept-language"] = "es-ES,it-IT;q=0.8,de;q=0.7";
      expect(resolvePreferredLocale()).toBe("it");
    });

    it("falls back to the default when no Accept-Language tag matches", () => {
      mockHeaders["accept-language"] = "es-ES,pt-PT;q=0.9";
      expect(resolvePreferredLocale()).toBe("de");
    });
  });

  describe("locale-aware redirect for unlocalized paths", () => {
    it("redirects / using the browser Accept-Language", async () => {
      mockHeaders["accept-language"] = "it-IT,it;q=0.9";
      await redirector({ path: "/", query: {} });
      expect(navigateToMock).toHaveBeenCalledExactlyOnceWith(
        { path: "/it/map", query: {} },
        { redirectCode: 302 },
      );
    });

    it("redirects an unlocalized specific path using Accept-Language", async () => {
      mockHeaders["accept-language"] = "fr-CH,fr;q=0.9";
      await redirector({ path: "/dataset", query: {} });
      expect(navigateToMock).toHaveBeenCalledExactlyOnceWith(
        { path: "/fr/dataset", query: {} },
        { redirectCode: 302 },
      );
    });
  });
});
