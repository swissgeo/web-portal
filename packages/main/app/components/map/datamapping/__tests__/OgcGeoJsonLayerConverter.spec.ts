import type { Distribution } from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import OgcGeoJsonLayerConverter from "../OgcGeoJsonLayerConverter.vue";

vi.mock("@/components/map/datamapping/useOgcGeoJsonData", async () => {
  const { ref } = await import("vue");
  return { useOgcGeoJsonData: () => ({ geoJsonLayerData: ref(null) }) };
});

const LEGEND_URL = "https://example.com/legend.png";

const distribution: Distribution = {
  id: "geojson",
  links: [{ rel: "legend", type: "image/png", href: LEGEND_URL }],
  properties: { type: "Distribution", title: "Layer", protocol: "geojson" },
};

describe("OgcGeoJsonLayerConverter", () => {
  it("emits the legend linked by the distribution", () => {
    const wrapper = mount(OgcGeoJsonLayerConverter, {
      props: { distribution },
    });
    expect(wrapper.emitted("updateLegends")?.at(-1)).toEqual([
      [{ href: LEGEND_URL, format: "image/png" }],
    ]);
  });
});
