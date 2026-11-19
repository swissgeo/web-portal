import { expect, test } from "@playwright/test";

test.describe("Mobile default", () => {
  test("sample", async ({ page }) => {
    await page.goto("/");

    expect(true).toBe(true);
  });
});
