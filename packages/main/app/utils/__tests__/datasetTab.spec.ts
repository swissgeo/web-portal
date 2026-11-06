import { describe, expect, it } from "vitest";

import { isDatasetTab } from "../datasetTab";

describe("isDatasetTab", () => {
  it.each`
    value            | expected
    ${"overview"}    | ${true}
    ${"legend"}      | ${true}
    ${"data-access"} | ${true}
    ${"metadata"}    | ${true}
    ${"unknown"}     | ${false}
    ${""}            | ${false}
    ${null}          | ${false}
    ${undefined}     | ${false}
    ${["legend"]}    | ${false}
  `("accepts $value as a tab: $expected", ({ value, expected }) => {
    expect(isDatasetTab(value)).toBe(expected);
  });
});
