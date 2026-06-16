import { describe, expect, it } from "vitest";

import { pickLocaleFromAcceptLanguage } from "../language";

describe("pickLocaleFromAcceptLanguage", () => {
  it("should return the highest quality matching locale", () => {
    const acceptLanguage = "de,fr;q=0.8,en;q=0.6";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBe("de");
  });

  it("should return the first matching locale, ignoring quality values", () => {
    const acceptLanguage = "en;q=0.6,fr;q=0.8,de;q=1.0";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBe("en");
  });

  it("should return null if no matching locale is found", () => {
    const acceptLanguage = "es,pt;q=0.8";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBeUndefined();
  });

  it("should return null if the header is empty", () => {
    const acceptLanguage = "";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBeUndefined();
  });

  it("should return null if the header is undefined", () => {
    const acceptLanguage: string = undefined;
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBeUndefined();
  });

  it("should handle regional subtags", () => {
    const acceptLanguage = "fr-CH,fr;q=0.8,en;q=0.6";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBe("fr");
  });

  it("should ignore whitespace and case", () => {
    const acceptLanguage = "  DE , FR ; q=0.8 , EN ; q=0.6 ";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBe("de");
  });

  it("should ignore empty tags", () => {
    const acceptLanguage = "de,,fr;q=0.8,,en;q=0.6,";
    const supportedLocales = ["en", "fr", "de"];
    const result = pickLocaleFromAcceptLanguage(
      acceptLanguage,
      supportedLocales,
    );
    expect(result).toBe("de");
  });
});
