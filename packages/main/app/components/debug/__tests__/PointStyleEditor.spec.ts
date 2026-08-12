import { mount } from "@vue/test-utils";
import PointStyleEditor from "~/components/debug/PointStyleEditor.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { drawingRefs } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    drawingRefs: {
      iconAnchor: ref<[number, number]>([0.5, 0.5]),
      iconColor: ref("#ff0000"),
      iconName: ref("marker"),
      iconSetName: ref("default"),
      iconSize: ref("small"),
      showDescription: ref(false),
      showIcon: ref(true),
      showTitle: ref(true),
      textColor: ref("#000000"),
      textHaloColor: ref("#ffffff"),
      textPlacement: ref("north"),
      textSize: ref("medium"),
    },
  };
});

vi.mock("@swissgeo/drawing", () => ({
  ICON_SIZE: {
    xsmall: 8,
    small: 12,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
  TEXT_SIZE: {
    xsmall: 12,
    small: 15,
    medium: 22,
    large: 30,
    xlarge: 36,
  },
  useDrawing: () => drawingRefs,
}));

const UAccordionStub = {
  template: '<div><slot name="text-body" /><slot name="icon-body" /></div>',
};
const UCheckboxStub = {
  props: ["modelValue"],
  template: '<input type="checkbox" :checked="modelValue" />',
};
const USelectStub = {
  props: ["items", "modelValue"],
  template:
    '<select><option v-for="item in items">{{ item.label }}</option></select>',
};
const IconPickerStub = {
  name: "IconPicker",
  emits: ["color-selected", "icon-selected"],
  template: '<div data-testid="icon-picker-stub" />',
};
const PlacementSelectorStub = {
  name: "PlacementSelector",
  emits: ["placement-selected"],
  template: '<div data-testid="placement-selector-stub" />',
};

function mountEditor() {
  return mount(PointStyleEditor, {
    global: {
      stubs: {
        IconPicker: IconPickerStub,
        PlacementSelector: PlacementSelectorStub,
        UAccordion: UAccordionStub,
        UCheckbox: UCheckboxStub,
        USelect: USelectStub,
      },
    },
  });
}

describe("PointStyleEditor", () => {
  beforeEach(() => {
    drawingRefs.iconAnchor.value = [0.5, 0.5];
    drawingRefs.iconColor.value = "#ff0000";
    drawingRefs.iconName.value = "marker";
    drawingRefs.iconSetName.value = "default";
    drawingRefs.iconSize.value = "small";
    drawingRefs.showDescription.value = false;
    drawingRefs.showIcon.value = true;
    drawingRefs.showTitle.value = true;
    drawingRefs.textColor.value = "#000000";
    drawingRefs.textHaloColor.value = "#ffffff";
    drawingRefs.textPlacement.value = "north";
    drawingRefs.textSize.value = "medium";
  });

  it("offers every supported icon and text size", () => {
    const wrapper = mountEditor();
    const selects = wrapper.findAllComponents(USelectStub);

    expect(
      selects[0]!.props("items").map(({ value }: { value: string }) => value),
    ).toEqual(["xsmall", "small", "medium", "large", "xlarge"]);
    expect(
      selects[1]!.props("items").map(({ value }: { value: string }) => value),
    ).toEqual(["xsmall", "small", "medium", "large", "xlarge"]);
  });

  it("updates icon identity and anchor from the picker", () => {
    const wrapper = mountEditor();
    const picker = wrapper.findComponent(IconPickerStub);
    const icon = {
      anchor: [0.25, 1],
      iconSet: "transport",
      name: "station",
    };

    picker.vm.$emit("icon-selected", icon);
    picker.vm.$emit("color-selected", "#123456");

    expect(drawingRefs.iconAnchor.value).toEqual([0.25, 1]);
    expect(drawingRefs.iconSetName.value).toBe("transport");
    expect(drawingRefs.iconName.value).toBe("station");
    expect(drawingRefs.iconColor.value).toBe("#123456");
  });

  it("updates relative text placement from the selector", () => {
    const wrapper = mountEditor();

    wrapper
      .findComponent(PlacementSelectorStub)
      .vm.$emit("placement-selected", "south-east");

    expect(drawingRefs.textPlacement.value).toBe("south-east");
  });

  it("hides dependent controls when icon and text are disabled", async () => {
    const wrapper = mountEditor();
    drawingRefs.showIcon.value = false;
    drawingRefs.showTitle.value = false;
    drawingRefs.showDescription.value = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="icon-picker-stub"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[data-testid="placement-selector-stub"]').exists(),
    ).toBe(false);
    expect(wrapper.findAll('input[type="color"]')).toHaveLength(0);
  });
});
