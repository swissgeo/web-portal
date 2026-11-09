import { describe, expect, it } from "vitest";

import { isMappableDataset } from "../mappableDataset";

describe("isMappableDataset", () => {
  it.each`
    case                                 | properties                                                     | expected
    ${"a WMTS distribution"}             | ${{ preferredDistributionId: "ch.swisstopo.pixelkarte:wmts" }} | ${true}
    ${"a GeoJSON distribution"}          | ${{ preferredDistributionId: "ch.bafu.example:geojson" }}      | ${true}
    ${"only a STAC distribution"}        | ${{}}                                                          | ${false}
    ${"an empty preferred distribution"} | ${{ preferredDistributionId: "" }}                             | ${false}
    ${"no properties"}                   | ${undefined}                                                   | ${false}
  `(
    "returns $expected for a dataset with $case",
    ({ properties, expected }) => {
      expect(isMappableDataset({ properties })).toBe(expected);
    },
  );
});
