import type { Distribution } from "@swissgeo/ogc";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import OgcGeoJsonLayerConverter from "../OgcGeoJsonLayerConverter.vue";

const LAYER_ID = "ch.meteoschweiz.messwerte-lufttemperatur-10min";

const { locale } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { locale: ref("de") };
});

mockNuxtImport("useI18n", () => () => ({ locale }));

vi.mock("@/components/map/datamapping/useOgcGeoJsonData", async () => {
  const { ref } = await import("vue");
  return { useOgcGeoJsonData: () => ({ geoJsonLayerData: ref(null) }) };
});

const distribution: Distribution = {
  id: `${LAYER_ID}:geojson`,
  links: [
    {
      rel: "about",
      type: "application/geo+json",
      href: `https://data.geo.admin.ch/${LAYER_ID}/${LAYER_ID}_de.json`,
    },
  ],
  properties: { type: "Distribution", title: "Layer", protocol: "geojson" },
};

function legendOf(lang: string) {
  return [
    {
      href: `https://api3.geo.admin.ch/static/images/legends/${LAYER_ID}_${lang}.png`,
      format: "image/png",
    },
  ];
}

describe("OgcGeoJsonLayerConverter", () => {
  it("emits the BGDI legend of the layer, and again when the locale changes", async () => {
    const wrapper = mount(OgcGeoJsonLayerConverter, {
      props: { distribution, layerId: LAYER_ID },
    });
    expect(wrapper.emitted("updateLegends")?.at(-1)).toEqual([legendOf("de")]);

    locale.value = "fr";
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("updateLegends")?.at(-1)).toEqual([legendOf("fr")]);
  });
});
