import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CircleStyleEditor from "../CircleStyleEditor.vue";
import LinestringStyleEditor from "../LinestringStyleEditor.vue";
import PolygonStyleEditor from "../PolygonStyleEditor.vue";

const { drawing } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    drawing: {
      fillColor: ref("#ff0000"),
      strokeColor: ref("#ff0000"),
      strokeWidth: ref(2),
      focusedFeatureMetrics: ref<Record<string, number> | null>(null),
    },
  };
});
vi.mock("@swissgeo/drawing", () => ({ useDrawing: () => drawing }));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: "en" } }),
}));

beforeEach(() => {
  drawing.fillColor.value = "#ff0000";
  drawing.strokeColor.value = "#ff0000";
  drawing.strokeWidth.value = 2;
  drawing.focusedFeatureMetrics.value = null;
});

describe.each([
  ["circle", CircleStyleEditor],
  ["polygon", PolygonStyleEditor],
  ["linestring", LinestringStyleEditor],
] as const)("%s style editor", (name, component) => {
  it("updates saved colors and numeric stroke width", async () => {
    const wrapper = mount(component);
    await wrapper
      .get(`[data-testid="${name}-stroke-color"]`)
      .setValue("#123456");
    await wrapper.get(`[data-testid="${name}-stroke-width"]`).setValue("0");
    expect(drawing.strokeColor.value).toBe("#123456");
    expect(drawing.strokeWidth.value).toBe(0);
    if (name !== "linestring") {
      await wrapper
        .get(`[data-testid="${name}-fill-color"]`)
        .setValue("#abcdef");
      expect(drawing.fillColor.value).toBe("#abcdef");
    }
  });

  it("shows rounded metrics only when they are available", async () => {
    const wrapper = mount(component);
    expect(wrapper.find("dl").exists()).toBe(false);
    drawing.focusedFeatureMetrics.value = {
      lengthMeters: 1234.6,
      perimeterMeters: 1234.6,
      radiusMeters: 42.2,
      areaSquareMeters: 5678.8,
    };
    await wrapper.vm.$nextTick();
    expect(wrapper.get("dl").text()).toContain("1,235 m");
    if (name !== "linestring") {
      expect(wrapper.get(`[data-testid="${name}-area"]`).text()).toContain(
        "5,679 m²",
      );
    }
    if (name === "circle") {
      expect(wrapper.get('[data-testid="circle-radius"]').text()).toContain(
        "42 m",
      );
    }
  });
});
