import { describe, expect, it } from "vitest";

import type { SearchResult } from "../../types/search";

import { isLayerSearchResult } from "../../types/search";

describe("isLayerSearchResult", () => {
  it.each`
    resultType      | isLayer
    ${"LAYER"}      | ${true}
    ${"LOCATION"}   | ${false}
    ${"FEATURE"}    | ${false}
    ${"COORDINATE"} | ${false}
    ${"CONTENT"}    | ${false}
  `(
    "returns $isLayer for the result type $resultType",
    ({ resultType, isLayer }) => {
      const result: SearchResult = {
        resultType,
        id: "id",
        title: "Title",
        sanitizedTitle: "Title",
        description: "",
      };

      expect(isLayerSearchResult(result)).toBe(isLayer);
    },
  );
});
