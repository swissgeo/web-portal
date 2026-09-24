// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "../utils/sanitizeHtml";

describe("sanitizeHtml", () => {
  it("should strip dangerous attributes and tags", () => {
    expect(sanitizeHtml("<img src=x onerror=alert(1)>")).toBe('<img src="x">');
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe("");
    expect(
      sanitizeHtml("<iframe src=\"javascript:alert('xss')\"></iframe>"),
    ).toBe("");
    expect(
      sanitizeHtml("<object data=\"javascript:alert('xss')\"></object>"),
    ).toBe("");
  });

  it("should allow safe inline HTML tags", () => {
    expect(sanitizeHtml("<strong>bold</strong>")).toBe("<strong>bold</strong>");
    expect(sanitizeHtml("<em>italic</em>")).toBe("<em>italic</em>");
  });

  it("should return clean text unchanged", () => {
    expect(sanitizeHtml("Hello World")).toBe("Hello World");
    expect(sanitizeHtml("no html here")).toBe("no html here");
  });

  it("should handle empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("should respect custom DOMPurify config", () => {
    const result = sanitizeHtml("<strong>keep</strong>", {
      USE_PROFILES: { html: false },
    });
    expect(result).toBe("keep");
  });
});
