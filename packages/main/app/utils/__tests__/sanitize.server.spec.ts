import { expect, it, vi } from "vitest";

// On the server, DOMPurify has no DOM and therefore no addHook or sanitize.
vi.mock("dompurify", () => ({ default: { isSupported: false } }));

it("loads on the server, where DOMPurify has no addHook", async () => {
  await expect(import("../sanitize")).resolves.toHaveProperty("sanitizeHtml");
});

it("refuses to sanitize on the server", async () => {
  const { sanitizeHtml } = await import("../sanitize");

  expect(() => sanitizeHtml("<b>text</b>", "blocked")).toThrow(
    "sanitizeHtml needs a browser DOM",
  );
});
