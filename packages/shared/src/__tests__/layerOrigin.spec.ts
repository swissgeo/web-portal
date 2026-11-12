import { describe, expect, it } from "vitest";

import { describeLayerOrigin } from "../layerOrigin";

describe("describeLayerOrigin", () => {
  it.each`
    origin                                                    | expected
    ${{ kind: "dataset", datasetId: "dat_haltestellen-oev" }} | ${"dataset dat_haltestellen-oev"}
    ${{ kind: "file", fileName: "route.kml" }}                | ${"file route.kml"}
  `("names $origin.kind origins as $expected", ({ origin, expected }) => {
    expect(describeLayerOrigin(origin)).toBe(expected);
  });
});
