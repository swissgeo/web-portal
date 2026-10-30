import type { Owner } from "@swissgeo/ogc";

import { mount } from "@vue/test-utils";
import LayerCatalogOwner from "~/components/sidebar/layerCatalog/LayerCatalogOwner.vue";
import { describe, expect, it } from "vitest";

function mountOwner(owner: Owner) {
  return mount(LayerCatalogOwner, { props: { owner } });
}

describe("LayerCatalogOwner.vue", () => {
  it("shows the acronym in bold, followed by the name", () => {
    const wrapper = mountOwner({
      id: "ch.bfe",
      name: "Bundesamt für Energie",
      acronym: "BFE",
    });

    expect(wrapper.text()).toBe("BFE (Bundesamt für Energie)");
    expect(wrapper.get("strong").text()).toBe("BFE");
  });

  it("does not repeat the acronym at the end of the name", () => {
    const wrapper = mountOwner({
      id: "ch.bfs",
      name: "Bundesamt für Statistik BFS",
      acronym: "BFS",
    });

    expect(wrapper.text()).toBe("BFS (Bundesamt für Statistik)");
  });

  it("shows only the acronym when it is the whole name", () => {
    const wrapper = mountOwner({
      id: "ch.agroscope",
      name: "Agroscope",
      acronym: "Agroscope",
    });

    expect(wrapper.text()).toBe("Agroscope");
  });
});
