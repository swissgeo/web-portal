import type { LayerSource } from "@swissgeo/feature";

import { getUrlTemplate } from "~/utils/featureInfoUtils";
import { describe, expect, it } from "vitest";

const UUID = "layer-1";
const LAYER_ID = "ch.test.layer";
const BASE_URL = "https://example.test/MapServer";
const TEMPLATE = `${BASE_URL}/${LAYER_ID}/{featureId}/htmlPopup?lang={lang}`;

function makeSource(overrides: Partial<LayerSource> = {}): LayerSource {
  return {
    layerUuid: UUID,
    layerId: LAYER_ID,
    layerName: null,
    ...overrides,
  };
}

describe("getUrlTemplate", () => {
  it("delegates to P2 and builds the template for a geoadmin:features source", () => {
    expect(
      getUrlTemplate(
        makeSource({
          getFeatureInfoInformation: {
            protocol: "geoadmin:features",
            baseUrl: BASE_URL,
          },
        }),
      ),
    ).toBe(TEMPLATE);
  });

  it("builds the template for the ogc:api3features protocol (ticket safeguard)", () => {
    expect(
      getUrlTemplate(
        makeSource({
          getFeatureInfoInformation: {
            protocol: "ogc:api3features",
            baseUrl: BASE_URL,
          },
        }),
      ),
    ).toBe(TEMPLATE);
  });

  it("returns undefined when the source has no feature info", () => {
    expect(getUrlTemplate(makeSource())).toBeUndefined();
  });

  it("returns undefined when the protocol is not identify-capable", () => {
    expect(
      getUrlTemplate(
        makeSource({
          getFeatureInfoInformation: {
            protocol: "ogc:wms",
            baseUrl: BASE_URL,
          },
        }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when there is no baseUrl to build the template from", () => {
    expect(
      getUrlTemplate(
        makeSource({
          getFeatureInfoInformation: {
            protocol: "geoadmin:features",
            baseUrl: undefined,
          },
        }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined for pre-resolved features (P1 wins, no template)", () => {
    expect(
      getUrlTemplate(
        makeSource({
          getFeatureInfoInformation: {
            protocol: "geoadmin:features",
            baseUrl: BASE_URL,
          },
          preResolvedFeatures: [
            {
              type: "Feature",
              id: 1,
              geometry: { type: "Point", coordinates: [0, 0] },
              properties: {},
            },
          ],
        }),
      ),
    ).toBeUndefined();
  });
});
