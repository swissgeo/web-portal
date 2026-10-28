import type { AsyncDataRequestStatus } from "#app";
import type { ThesaurusConcept } from "~/types/thesaurus";

import { mount } from "@vue/test-utils";
import LayerCatalogLoadingStatus from "~/components/sidebar/layerCatalog/LayerCatalogLoadingStatus.vue";
import LayerCatalogTreeMobile from "~/components/sidebar/layerCatalog/LayerCatalogTreeMobile.vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const stubs = {
  UButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
};

const concepts: ThesaurusConcept[] = [
  {
    id: "nature",
    label: "Natur und Umwelt",
    children: [
      {
        id: "geoscience",
        label: "Geowissenschaften",
        children: [
          { id: "soils", label: "Boden", children: [] },
          { id: "geology", label: "Geologie", children: [] },
        ],
      },
      { id: "biota", label: "Wald, Flora, Fauna", children: [] },
    ],
  },
  { id: "planning", label: "Planung", children: [] },
];

function mountList(
  conceptId: string | null,
  status: AsyncDataRequestStatus = "success",
) {
  const wrapper = mount(LayerCatalogTreeMobile, {
    props: {
      conceptId,
      concepts,
      status,
      "onUpdate:conceptId": (value: string | null) =>
        wrapper.setProps({ conceptId: value }),
    },
    global: { stubs },
  });
  return wrapper;
}

type Wrapper = ReturnType<typeof mountList>;

/** Labels of the entries below the header, in order */
function entryLabels(wrapper: Wrapper) {
  return wrapper
    .findAll("button")
    .map((button) => button.text())
    .filter((label) => label);
}

function entry(wrapper: Wrapper, label: string) {
  const button = wrapper
    .findAll("button")
    .find((candidate) => candidate.text() === label);
  if (!button) {
    throw new Error(
      `No entry "${label}" in ${entryLabels(wrapper).join(", ")}`,
    );
  }
  return button;
}

function isHighlighted(wrapper: Wrapper, label: string) {
  return entry(wrapper, label).classes().includes("bg-elevated");
}

describe("LayerCatalogTreeMobile.vue", () => {
  it("shows the top-level concepts below the root", () => {
    const wrapper = mountList(null);

    expect(entryLabels(wrapper)).toEqual([
      "layerCatalog.allLayers",
      "Natur und Umwelt",
      "Planung",
    ]);
  });

  it("marks the entries that contain more concepts", () => {
    const wrapper = mountList(null);

    expect(entry(wrapper, "Natur und Umwelt").attributes("trailing-icon")).toBe(
      "i-lucide-chevron-right",
    );
    expect(
      entry(wrapper, "Planung").attributes("trailing-icon"),
    ).toBeUndefined();
  });

  it("highlights the selected folder", () => {
    const wrapper = mountList(null);

    expect(isHighlighted(wrapper, "layerCatalog.allLayers")).toBe(true);
    expect(isHighlighted(wrapper, "Natur und Umwelt")).toBe(false);
  });

  it("selects a concept with children and shows its children, without closing", async () => {
    const wrapper = mountList(null);

    await entry(wrapper, "Natur und Umwelt").trigger("click");

    expect(wrapper.props("conceptId")).toBe("nature");
    expect(entryLabels(wrapper)).toEqual([
      "layerCatalog.back",
      "Natur und Umwelt",
      "Geowissenschaften",
      "Wald, Flora, Fauna",
    ]);
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("selects a concept without children and closes", async () => {
    const wrapper = mountList("geoscience");

    await entry(wrapper, "Boden").trigger("click");

    expect(wrapper.props("conceptId")).toBe("soils");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("shows a selected concept without children within its parent, highlighted", () => {
    const wrapper = mountList("soils");

    expect(entryLabels(wrapper)).toEqual([
      "layerCatalog.back",
      "Geowissenschaften",
      "Boden",
      "Geologie",
    ]);
    expect(isHighlighted(wrapper, "Boden")).toBe(true);
    expect(isHighlighted(wrapper, "Geowissenschaften")).toBe(false);
  });

  it("goes back by selecting the parent of the shown folder", async () => {
    const wrapper = mountList("soils");

    await entry(wrapper, "layerCatalog.back").trigger("click");
    expect(wrapper.props("conceptId")).toBe("nature");

    await entry(wrapper, "layerCatalog.back").trigger("click");
    expect(wrapper.props("conceptId")).toBeNull();
    expect(entryLabels(wrapper)).toEqual([
      "layerCatalog.allLayers",
      "Natur und Umwelt",
      "Planung",
    ]);
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("selects the shown folder and closes when its title is used", async () => {
    const wrapper = mountList("soils");

    await entry(wrapper, "Geowissenschaften").trigger("click");

    expect(wrapper.props("conceptId")).toBe("geoscience");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("closes without changing the selection", async () => {
    const wrapper = mountList("soils");

    await wrapper
      .get("button[aria-label='layerCatalog.close']")
      .trigger("click");

    expect(wrapper.props("conceptId")).toBe("soils");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("shows the loading status of the concepts instead of the entries", () => {
    const wrapper = mountList(null, "error");

    expect(
      wrapper.getComponent(LayerCatalogLoadingStatus).props("status"),
    ).toBe("error");
    expect(entryLabels(wrapper)).toEqual([]);
  });
});
