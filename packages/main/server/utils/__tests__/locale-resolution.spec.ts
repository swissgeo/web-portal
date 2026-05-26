import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, resolveTargetLocale } from "../locale-resolution";

describe("locale-resolution", () => {
  describe("resolveTargetLocale", () => {
    it("uses Accept-Language when it has a supported tag", () => {
      expect(resolveTargetLocale("fr-CH,fr;q=0.9")).toBe("fr");
    });

    it("matches the primary subtag of a regional tag", () => {
      expect(resolveTargetLocale("fr-CH")).toBe("fr");
    });

    it("picks the first supported tag in priority order", () => {
      expect(resolveTargetLocale("es-ES,it-IT;q=0.8,de;q=0.7")).toBe("it");
    });

    it("falls back to the default locale when no Accept-Language tag is supported", () => {
      expect(resolveTargetLocale("es-ES,pt-PT;q=0.9")).toBe(DEFAULT_LOCALE);
    });

    it("falls back to the default locale when Accept-Language is missing", () => {
      expect(resolveTargetLocale(undefined)).toBe(DEFAULT_LOCALE);
    });

    it("falls back to the default locale when Accept-Language is empty", () => {
      expect(resolveTargetLocale("")).toBe(DEFAULT_LOCALE);
    });
  });
});
