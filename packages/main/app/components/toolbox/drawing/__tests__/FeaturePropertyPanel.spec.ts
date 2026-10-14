import { shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FeaturePropertyPanel from "../FeaturePropertyPanel.vue";

const { drawing } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    drawing: {
      focusedFeature: ref<{ getId: () => string } | null>(null),
      focusedFeatureType: ref<string | null>(null),
      title: ref(""),
      description: ref(""),
    },
  };
});
vi.mock("@swissgeo/drawing", () => ({ useDrawing: () => drawing }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
function mountPanel() {
  return shallowMount(FeaturePropertyPanel, {
    global: {
      stubs: {
        UFormField: { template: "<div><slot /></div>" },
      },
    },
  });
}
beforeEach(() => {
  drawing.focusedFeature.value = null;
  drawing.focusedFeatureType.value = null;
  drawing.title.value = "";
  drawing.description.value = "";
});
describe("FeaturePropertyPanel", () => {
  it("hides properties without a focused feature", () => {
    expect(
      mountPanel()
        .find('[data-testid="drawing-feature-property-panel"]')
        .exists(),
    ).toBe(false);
  });
  it.each(["Point", "LineString", "Circle", "Polygon"])(
    "shows the %s editor and updates metadata",
    (type) => {
      drawing.focusedFeature.value = { getId: () => "feature" };
      drawing.focusedFeatureType.value = type;
      const wrapper = mountPanel();
      expect(wrapper.get('[data-testid="drawing-feature-type"]').text()).toBe(
        `toolbox.drawing.properties.${type}`,
      );
      const editorName = type === "LineString" ? "Linestring" : type;
      expect(
        wrapper.findComponent({ name: `${editorName}StyleEditor` }).exists(),
      ).toBe(true);
      wrapper
        .getComponent({ name: "UInput" })
        .vm.$emit("update:modelValue", "A title");
      wrapper
        .getComponent({ name: "UTextarea" })
        .vm.$emit("update:modelValue", "A note");
      expect(drawing.title.value).toBe("A title");
      expect(drawing.description.value).toBe("A note");
    },
  );
});
