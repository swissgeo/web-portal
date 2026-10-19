import { expect, it, vi } from "vitest";

// On the server, DOMPurify has no DOM and therefore no addHook or sanitize.
vi.mock("dompurify", () => ({ default: { isSupported: false } }));

it("loads on the server, where DOMPurify has no addHook", async () => {
  await expect(import("../sanitize")).resolves.toHaveProperty("sanitizeHtml");
});
