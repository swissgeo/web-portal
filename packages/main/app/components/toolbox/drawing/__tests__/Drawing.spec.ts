import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Drawing from "../drawing.vue";

const {
  drawing,
  shareDrawings,
  isSharing,
  closeDetailPanel,
  copy,
  olMap,
  logError,
} = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    drawing: {
      disableAllInteractions: vi.fn(),
      enableSelectInteraction: vi.fn(),
      enableModifyInteraction: vi.fn(),
      removeFocus: vi.fn(),
      enableDrawInteraction: vi.fn(),
      removeFocusedFeature: vi.fn(),
      mountDrawingLayer: vi.fn(),
      clearDrawingLayer: vi.fn(),
      serializeAllFeaturesAsBlob: vi.fn(),
      numberOfFeatures: ref(0),
      focusMode: ref("none"),
      focusedFeature: ref<object | null>(null),
      focusedFeatureType: ref("Point"),
      isDrawingLayerInLayerStore: ref(true),
      drawingId: ref<string | null>(null),
      drawingAdminId: ref<string | null>(null),
      drawingS3Url: ref<string | null>(null),
    },
    shareDrawings: vi.fn(),
    isSharing: ref(false),
    closeDetailPanel: vi.fn(),
    copy: vi.fn(),
    olMap: ref({}),
    logError: vi.fn(),
  };
});
vi.mock("@swissgeo/drawing", () => ({ useDrawing: () => drawing }));
vi.mock("@swissgeo/map", () => ({ useMap: () => ({ olMap }) }));
vi.mock("@swissgeo/log", () => ({ default: { error: logError } }));
vi.mock("~/stores/toolbox", () => ({
  useToolboxStore: () => ({ closeDetailPanel }),
}));
vi.mock("@/composables/useShareDrawings", () => ({
  useShareDrawings: () => ({ shareDrawings, isSharing }),
}));
vi.mock("@vueuse/core", () => ({
  useClipboard: () => ({ copy, copied: { value: false } }),
}));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
const Button = {
  props: ["disabled", "label"],
  template: '<button :disabled="disabled"><slot />{{ label }}</button>',
};
const Input = {
  props: ["modelValue"],
  template: '<div><input :value="modelValue" /><slot name="trailing" /></div>',
};
const Dropdown = {
  props: ["items", "disabled"],
  template: "<div><slot /></div>",
};
function mountDrawing() {
  return mount(Drawing, {
    global: {
      stubs: {
        UCard: {
          template:
            '<div><slot name="header" /><slot /><slot name="footer" /></div>',
        },
        UButton: Button,
        UInput: Input,
        UDropdownMenu: Dropdown,
        UIcon: true,
        FeaturePropertyPanel: true,
        UTooltip: { template: "<div><slot /></div>" },
        USwitch: {
          props: ["modelValue"],
          template:
            '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
        },
      },
    },
  });
}
afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  vi.resetAllMocks();
  drawing.numberOfFeatures.value = 0;
  drawing.focusMode.value = "none";
  drawing.focusedFeature.value = null;
  drawing.isDrawingLayerInLayerStore.value = true;
  drawing.drawingId.value = null;
  drawing.drawingAdminId.value = null;
  drawing.drawingS3Url.value = null;
  isSharing.value = false;
});
describe("Drawing toolbox", () => {
  it("mounts the drawing layer and cleans up interactions on unmount", () => {
    const wrapper = mountDrawing();
    expect(drawing.mountDrawingLayer).toHaveBeenCalledWith(olMap.value);
    expect(
      wrapper.get('[data-testid="select-feature-tool"]').attributes("disabled"),
    ).toBeDefined();
    wrapper.unmount();
    expect(drawing.disableAllInteractions).toHaveBeenCalledOnce();
    expect(drawing.removeFocus).toHaveBeenCalledOnce();
  });

  it.each([
    ["polyline", "LineString"],
    ["polygon", "Polygon"],
    ["circle", "Circle"],
    ["text", "Point"],
    ["marker", "Point"],
  ])("starts drawing a %s", async (tool, geometry) => {
    const wrapper = mountDrawing();
    await wrapper.get(`[data-testid="drawing-tool-${tool}"]`).trigger("click");
    expect(drawing.enableDrawInteraction).toHaveBeenCalledWith(geometry);
    wrapper.unmount();
  });

  it("selects existing features and clears the scene", async () => {
    drawing.numberOfFeatures.value = 2;
    const wrapper = mountDrawing();
    await wrapper.get('[data-testid="select-feature-tool"]').trigger("click");
    expect(drawing.enableSelectInteraction).toHaveBeenCalledOnce();
    await wrapper.get('[data-testid="drawing-tool-clear"]').trigger("click");
    expect(drawing.clearDrawingLayer).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("cancels a drawing and removes the unfinished feature", async () => {
    drawing.focusMode.value = "create";
    const wrapper = mountDrawing();
    await wrapper.get('[data-testid="cancel-drawing-tool"]').trigger("click");
    expect(drawing.disableAllInteractions).toHaveBeenCalledOnce();
    expect(drawing.removeFocusedFeature).toHaveBeenCalledOnce();
    expect(drawing.removeFocus).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("edits, deletes, and deselects the selected feature", async () => {
    drawing.focusMode.value = "select";
    drawing.focusedFeature.value = {};
    const wrapper = mountDrawing();
    await wrapper.get('[data-testid="modify-geometry-tool"]').trigger("click");
    expect(drawing.enableModifyInteraction).toHaveBeenCalledOnce();
    await wrapper.get('[data-testid="delete-feature-tool"]').trigger("click");
    expect(drawing.removeFocusedFeature).toHaveBeenCalledOnce();
    await wrapper.get('[data-testid="deselect-feature-tool"]').trigger("click");
    expect(drawing.disableAllInteractions).toHaveBeenCalledOnce();
    expect(drawing.removeFocus).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("finishes geometry editing", async () => {
    drawing.focusMode.value = "edit";
    drawing.focusedFeature.value = {};
    const wrapper = mountDrawing();
    await wrapper
      .get('[data-testid="finish-modification-tool"]')
      .trigger("click");
    expect(drawing.disableAllInteractions).toHaveBeenCalledOnce();
    expect(drawing.removeFocus).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("closes when its layer is removed", async () => {
    const wrapper = mountDrawing();
    drawing.isDrawingLayerInLayerStore.value = false;
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("close")).toEqual([[]]);
    wrapper.unmount();
  });

  it.each([false, true])(
    "syncs completed edits only after sharing (shared: %s)",
    async (shared) => {
      drawing.focusMode.value = "edit";
      if (shared) {
        drawing.drawingId.value = "drawing";
        drawing.drawingAdminId.value = "admin";
      }
      const wrapper = mountDrawing();
      drawing.focusMode.value = "none";
      await flushPromises();
      expect(shareDrawings).toHaveBeenCalledTimes(shared ? 1 : 0);
      wrapper.unmount();
    },
  );

  it("shares explicitly and includes the admin ID only when editing is enabled", async () => {
    const wrapper = mountDrawing();
    const sync = wrapper
      .findAll("button")
      .find((button) => button.text() === "toolbox.drawing.sync")!;
    await sync.trigger("click");
    expect(shareDrawings).toHaveBeenCalledOnce();
    drawing.drawingS3Url.value = "https://drawings.test/drawing";
    drawing.drawingAdminId.value = "admin";
    await wrapper.vm.$nextTick();
    expect(
      (wrapper.get('input:not([type="checkbox"])').element as HTMLInputElement)
        .value,
    ).toBe("https://drawings.test/drawing");
    await wrapper.get('input[type="checkbox"]').setValue(true);
    expect(
      (wrapper.get('input:not([type="checkbox"])').element as HTMLInputElement)
        .value,
    ).toBe("https://drawings.test/drawing#admin");
    await wrapper
      .get('button[aria-label="toolbox.drawing.copy"]')
      .trigger("click");
    expect(copy).toHaveBeenCalledWith("https://drawings.test/drawing#admin");
    wrapper.unmount();
  });

  it.each(["geojson", "gpx-track", "gpx-route", "kml", "kmz"])(
    "downloads a %s export and releases its object URL",
    async (format) => {
      const blob = new Blob(["drawing"]);
      drawing.serializeAllFeaturesAsBlob.mockResolvedValueOnce(blob);
      const create = vi
        .spyOn(URL, "createObjectURL")
        .mockReturnValue("blob:drawing");
      const revoke = vi
        .spyOn(URL, "revokeObjectURL")
        .mockImplementation(() => {});
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});
      const wrapper = mountDrawing();
      const items = wrapper.getComponent(Dropdown).props("items");
      const index = ["geojson", "gpx-track", "gpx-route", "kml", "kmz"].indexOf(
        format,
      );
      await items[index].onClick();
      expect(drawing.serializeAllFeaturesAsBlob).toHaveBeenCalledWith(format);
      expect(create).toHaveBeenCalledWith(blob);
      expect(click).toHaveBeenCalledOnce();
      expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(
        `scene.${format.split("-")[0]}`,
      );
      expect(revoke).toHaveBeenCalledWith("blob:drawing");
      wrapper.unmount();
    },
  );

  it("logs export failures", async () => {
    drawing.serializeAllFeaturesAsBlob.mockRejectedValueOnce(
      new Error("Invalid drawing"),
    );
    const wrapper = mountDrawing();
    await wrapper.getComponent(Dropdown).props("items")[0].onClick();
    expect(logError).toHaveBeenCalledWith("Failed to export all features");
    wrapper.unmount();
  });
});
