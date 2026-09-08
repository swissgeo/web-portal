import { mount } from "@vue/test-utils";
import IconPicker from "~/components/debug/IconPicker.vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { iconSets, stationIcon, warningIcon } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  const stationIcon = {
    getDefaultDescription: vi.fn(() => "Station"),
    getName: vi.fn(() => "station"),
    getUrl: vi.fn(
      ({ color }: { color: string }) =>
        `https://icons.test/station-${color}.png`,
    ),
  };
  const warningIcon = {
    getDefaultDescription: vi.fn(() => null),
    getName: vi.fn(() => "warning"),
    getUrl: vi.fn(
      ({ color }: { color: string }) =>
        `https://icons.test/warning-${color}.png`,
    ),
  };
  return {
    iconSets: ref([
      {
        colorable: true,
        getHumanReadableName: () => "Transport",
        icons: [stationIcon],
        name: "transport",
      },
      {
        colorable: false,
        getHumanReadableName: () => "Warnings",
        icons: [warningIcon],
        name: "warnings",
      },
    ]),
    stationIcon,
    warningIcon,
  };
});

vi.mock("@swissgeo/drawing", () => ({
  useIconsStore: () => ({ iconSets }),
}));

vi.mock("pinia", () => ({
  storeToRefs: () => ({ iconSets }),
}));

const USelectStub = {
  props: ["items", "modelValue"],
  emits: ["update:modelValue"],
  template: `<select
    data-testid="icon-set-select"
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
  ><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>`,
};

function mountPicker() {
  return mount(IconPicker, {
    global: { stubs: { USelect: USelectStub } },
    props: {
      iconColor: "#123456",
      iconName: "station",
      iconSetName: "transport",
    },
  });
}

describe("IconPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders localized icon-set labels and the selected set's icons", () => {
    const wrapper = mountPicker();
    const options = wrapper.findAll("option");
    const image = wrapper.find("img");

    expect(options.map((option) => option.text())).toEqual([
      "Transport",
      "Warnings",
    ]);
    expect(image.attributes("alt")).toBe("Station");
    expect(image.attributes("src")).toBe(
      "https://icons.test/station-#123456.png",
    );
    expect(image.classes()).toContain("bg-gray-300");
  });

  it("emits the selected icon", async () => {
    const wrapper = mountPicker();

    await wrapper.find("img").trigger("click");

    expect(wrapper.emitted("icon-selected")).toEqual([[stationIcon]]);
  });

  it("debounces color changes for colorable sets", async () => {
    const wrapper = mountPicker();

    await wrapper.find('[data-testid="icon-color"]').setValue("#abcdef");
    expect(wrapper.emitted("color-selected")).toBeUndefined();

    await vi.advanceTimersByTimeAsync(200);

    expect(wrapper.emitted("color-selected")).toEqual([["#abcdef"]]);
  });

  it("updates displayed icons when the icon-set prop changes", async () => {
    const wrapper = mountPicker();

    await wrapper.setProps({ iconSetName: "warnings", iconName: "warning" });

    expect(wrapper.find("img").attributes("alt")).toBe("warning");
    expect(wrapper.find('[data-testid="icon-color"]').exists()).toBe(false);
    await wrapper.find("img").trigger("click");
    expect(wrapper.emitted("icon-selected")).toEqual([[warningIcon]]);
  });
});
