import log from "@swissgeo/log";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sanitizeHtml } from "../sanitize";

// The happy-dom nodeName shim lives in tests/setup.ts (applies to both
// vitest projects, self-disabling on real DOMs).

vi.mock("@swissgeo/log", () => ({
  default: { error: vi.fn() },
}));

const MESSAGE = "blocked test message";

describe("sanitizeHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dangerous content removal", () => {
    it("strips script tags but keeps surrounding markup", () => {
      const result = sanitizeHtml(
        "<p>ok</p><script>alert(1)</script>",
        MESSAGE,
      );
      expect(result).toContain("<p>ok</p>");
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    it("strips inline event handlers", () => {
      const result = sanitizeHtml(
        '<button onclick="alert(1)">click</button>',
        MESSAGE,
      );
      expect(result).toContain("<button");
      expect(result).not.toContain("onclick");
    });

    it("strips iframes", () => {
      const result = sanitizeHtml(
        '<iframe src="https://map.geo.admin.ch/embed"></iframe><p>x</p>',
        MESSAGE,
      );
      expect(result).toContain("<p>x</p>");
      expect(result).not.toContain("iframe");
    });

    it("removes hrefs with a disallowed URI scheme", () => {
      const result = sanitizeHtml(
        '<a href="javascript:alert(1)">x</a>',
        MESSAGE,
      );
      expect(result).toContain("<a");
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain(MESSAGE);
    });
  });

  describe("link hardening", () => {
    it("forces target=_blank and rel=noopener noreferrer on anchors", () => {
      const result = sanitizeHtml(
        '<a href="https://example.com">x</a>',
        MESSAGE,
      );
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it.each(["https", "http", "mailto", "tel", "sms"])(
      "keeps hrefs with the allowed scheme %s",
      (scheme) => {
        const result = sanitizeHtml(
          `<a href="${scheme}://example.com">x</a>`,
          MESSAGE,
        );
        expect(result).toContain(`href="${scheme}://example.com"`);
      },
    );

    it.each([
      "https://example.com/download.exe",
      "https://example.com/file.bat",
      "https://example.com/FILE.SH",
      "https://example.com/file.exe?download=1",
    ])(
      "replaces a link with a blocked extension (%s) by the message",
      (href) => {
        const result = sanitizeHtml(`<a href="${href}">x</a>`, MESSAGE);
        expect(result).toContain(MESSAGE);
        expect(result).not.toContain("<a");
      },
    );

    it("removes relative hrefs (rejected by the URI allowlist)", () => {
      const result = sanitizeHtml('<a href="page.html">x</a>', MESSAGE);
      expect(result).toContain(">x</a>");
      expect(result).not.toContain("href");
      expect(result).not.toContain("page.html");
      expect(result).not.toContain(MESSAGE);
    });

    it("replaces unparseable scheme-prefixed hrefs by the message and logs the failure", () => {
      const result = sanitizeHtml('<a href="https:">x</a>', MESSAGE);
      expect(result).toContain(MESSAGE);
      expect(result).not.toContain("https:");
      expect(log.error).toHaveBeenCalledOnce();
    });

    it("hardens href-less anchors but never replaces them", () => {
      const result = sanitizeHtml("<a>just text</a>", MESSAGE);
      expect(result).toContain("just text");
      expect(result).toContain('target="_blank"');
      expect(result).not.toContain(MESSAGE);
      expect(log.error).not.toHaveBeenCalled();
    });
  });

  describe("legitimate content", () => {
    it("passes plain text through unchanged", () => {
      expect(sanitizeHtml("hello world", MESSAGE)).toBe("hello world");
    });

    it("keeps rich description-style markup (tables, classes)", () => {
      const html =
        '<div class="evse-data"><table class="evse-overview"><tr><th>Availability unknown</th></tr></table></div>';
      const result = sanitizeHtml(html, MESSAGE);
      expect(result).toContain('class="evse-data"');
      expect(result).toContain("<table");
      expect(result).toContain("<th>Availability unknown</th>");
    });
  });

  describe("message threading", () => {
    it("uses the message of the current call, not a previous one", () => {
      const first = sanitizeHtml(
        '<a href="https://example.com/a.exe">a</a>',
        "first message",
      );
      const second = sanitizeHtml(
        '<a href="https://example.com/b.exe">b</a>',
        "second message",
      );
      expect(first).toContain("first message");
      expect(second).toContain("second message");
      expect(second).not.toContain("first message");
    });
  });
});
