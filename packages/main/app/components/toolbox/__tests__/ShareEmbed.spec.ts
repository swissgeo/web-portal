import type { VueWrapper } from "@vue/test-utils";
import type * as VueUse from "@vueuse/core";

import { mount } from "@vue/test-utils";
import ShareEmbed from "~/components/toolbox/share/ShareEmbed.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const { mockUseResizeObserver } = vi.hoisted(() => ({
  mockUseResizeObserver: vi.fn(
    (_target: unknown, callback: (_entries: unknown[]) => void) => {
      callback([{ contentRect: { width: 400, height: 256 } }]);
    },
  ),
}));

vi.mock("@vueuse/core", async (importOriginal) => ({
  ...(await importOriginal<typeof VueUse>()),
  useResizeObserver: mockUseResizeObserver,
}));

const stubs = {
  UFormField: {
    name: "UFormField",
    template: "<div><slot /></div>",
    props: ["label", "size"],
  },
  USelect: {
    name: "USelect",
    template: '<div v-bind="$attrs" />',
    props: ["modelValue", "items", "ui", "valueKey"],
    emits: ["update:modelValue"],
  },
  UInput: {
    name: "UInput",
    template: '<div v-bind="$attrs"><slot name="trailing" /></div>',
    props: [
      "modelValue",
      "type",
      "size",
      "color",
      "variant",
      "icon",
      "ui",
      "disabled",
    ],
    emits: ["update:modelValue", "blur"],
  },
  UCheckbox: {
    name: "UCheckbox",
    template: '<div v-bind="$attrs" />',
    props: ["modelValue", "label", "ui"],
    emits: ["update:modelValue"],
  },
  UButton: {
    name: "UButton",
    template: '<button v-bind="$attrs"><slot /></button>',
    props: ["color", "variant", "icon", "label"],
  },
};

function mountShareEmbed(props: Record<string, unknown> = {}) {
  return mount(ShareEmbed, {
    props: {
      embedCode: '<iframe src="https://example.test/embed"></iframe>',
      copied: false,
      stateId: "abc",
      resolution: { width: 800, height: 600 },
      zoomOnlyCtrl: false,
      fullWidth: false,
      ...props,
    },
    global: { stubs },
  });
}

function parseScale(transform: string): number {
  return Number(transform.replace("scale(", "").replace(")", ""));
}

function findCustomControls(wrapper: VueWrapper) {
  const testid = (c: { element: Element }) =>
    c.element.getAttribute("data-testid");
  const widthInput = wrapper
    .findAllComponents({ name: "UInput" })
    .find((c) => testid(c) === "share-embed-width-input");
  const heightInput = wrapper
    .findAllComponents({ name: "UInput" })
    .find((c) => testid(c) === "share-embed-height-input");
  const fullWidthCheckbox = wrapper
    .findAllComponents({ name: "UCheckbox" })
    .find((c) => testid(c) === "share-embed-full-width");
  if (!widthInput || !heightInput || !fullWidthCheckbox) {
    throw new Error("Custom resolution controls not found");
  }
  return { widthInput, heightInput, fullWidthCheckbox };
}

describe("ShareEmbed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders four size options with dimensions in the labels", () => {
    const wrapper = mountShareEmbed();
    const select = wrapper.getComponent({ name: "USelect" });

    const items = select.props("items");
    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({
      id: "small",
      label: "toolbox.share.embed.sizeSmall (400 × 300)",
    });
    expect(items[1]).toEqual({
      id: "medium",
      label: "toolbox.share.embed.sizeMedium (800 × 600)",
    });
    expect(items[2]).toEqual({
      id: "large",
      label: "toolbox.share.embed.sizeLarge (1200 × 900)",
    });
    expect(items[3].id).toBe("custom");
    expect(items[3].label).toBe("toolbox.share.embed.sizeCustom (800 × 600)");
  });

  it("emits the preset resolution when a preset is selected", async () => {
    const wrapper = mountShareEmbed();
    const select = wrapper.getComponent({ name: "USelect" });

    await select.vm.$emit("update:modelValue", "small");

    expect(wrapper.emitted("update:resolution")).toEqual([
      [{ width: 400, height: 300 }],
    ]);
  });

  it("keeps the current resolution and shows custom fields when custom is selected", async () => {
    const wrapper = mountShareEmbed();
    const select = wrapper.getComponent({ name: "USelect" });

    await select.vm.$emit("update:modelValue", "custom");
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("update:resolution")).toBeUndefined();
    expect(
      wrapper.find('[data-testid="share-embed-custom-fields"]').exists(),
    ).toBe(true);
  });

  it("clamps the custom width to the minimum on blur", async () => {
    const wrapper = mountShareEmbed();
    await wrapper
      .getComponent({ name: "USelect" })
      .vm.$emit("update:modelValue", "custom");
    await wrapper.vm.$nextTick();

    const { widthInput } = findCustomControls(wrapper);
    await widthInput.vm.$emit("update:modelValue", 100);
    await widthInput.vm.$emit("blur");

    expect(wrapper.emitted("update:resolution")?.at(-1)).toEqual([
      { width: 200, height: 600 },
    ]);
  });

  it("clamps the custom height to the maximum on blur", async () => {
    const wrapper = mountShareEmbed();
    await wrapper
      .getComponent({ name: "USelect" })
      .vm.$emit("update:modelValue", "custom");
    await wrapper.vm.$nextTick();

    const { heightInput } = findCustomControls(wrapper);
    await heightInput.vm.$emit("update:modelValue", 9999);
    await heightInput.vm.$emit("blur");

    expect(wrapper.emitted("update:resolution")?.at(-1)).toEqual([
      { width: 800, height: 4000 },
    ]);
  });

  it("emits fullWidth and disables the width input when enabled", async () => {
    const wrapper = mountShareEmbed();
    await wrapper
      .getComponent({ name: "USelect" })
      .vm.$emit("update:modelValue", "custom");
    await wrapper.vm.$nextTick();

    const { fullWidthCheckbox, widthInput } = findCustomControls(wrapper);
    await fullWidthCheckbox.vm.$emit("update:modelValue", true);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("update:fullWidth")).toEqual([[true]]);
    expect(widthInput.props("disabled")).toBe(true);
  });

  it("labels the custom option with 100% when fullWidth is set", async () => {
    const wrapper = mountShareEmbed({ fullWidth: true });
    await wrapper
      .getComponent({ name: "USelect" })
      .vm.$emit("update:modelValue", "custom");
    await wrapper.vm.$nextTick();

    const items = wrapper.getComponent({ name: "USelect" }).props("items");
    expect(items[3].label).toBe("toolbox.share.embed.sizeCustom (100% × 600)");
  });

  it("scales the preview down with a 1rem margin when not full width", () => {
    const wrapper = mountShareEmbed();
    const iframe = wrapper.get('[data-testid="share-embed-preview-iframe"]');
    const iframeEl = iframe.element as HTMLElement;

    const expectedScale = Math.min(368 / 800, 224 / 600);
    expect(parseScale(iframeEl.style.transform)).toBeCloseTo(expectedScale, 5);

    const scaledBox = iframeEl.parentElement as HTMLElement;
    expect(parseFloat(scaledBox.style.width)).toBeCloseTo(
      800 * expectedScale,
      1,
    );
    expect(parseFloat(scaledBox.style.height)).toBeCloseTo(224, 1);
  });

  it("fills the preview width edge to edge when fullWidth is set", () => {
    const wrapper = mountShareEmbed({ fullWidth: true });
    const iframe = wrapper.get('[data-testid="share-embed-preview-iframe"]');
    const iframeEl = iframe.element as HTMLElement;

    const expectedScale = 224 / 600;
    expect(parseScale(iframeEl.style.transform)).toBeCloseTo(expectedScale, 5);

    const scaledBox = iframeEl.parentElement as HTMLElement;
    expect(parseFloat(scaledBox.style.width)).toBeCloseTo(400, 1);
    expect(parseFloat(scaledBox.style.height)).toBeCloseTo(224, 1);
  });

  it("caps the scale at 1 for sizes that fit the preview", () => {
    const wrapper = mountShareEmbed({
      resolution: { width: 200, height: 200 },
    });
    const iframe = wrapper.get('[data-testid="share-embed-preview-iframe"]');

    expect(parseScale((iframe.element as HTMLElement).style.transform)).toBe(1);
  });

  it("renders no preview iframe without a state id", () => {
    const wrapper = mountShareEmbed({ stateId: null });

    expect(
      wrapper.find('[data-testid="share-embed-preview-iframe"]').exists(),
    ).toBe(false);
  });

  it("points the preview iframe at the embed route with the state id", () => {
    const wrapper = mountShareEmbed();
    const iframe = wrapper.get('[data-testid="share-embed-preview-iframe"]');

    expect(iframe.attributes("src")).toContain("/embed?state=abc");
    expect(iframe.attributes("src")).not.toContain("zoomOnlyCtrl");
  });

  it("adds zoomOnlyCtrl to the preview iframe url when enabled", () => {
    const wrapper = mountShareEmbed({ zoomOnlyCtrl: true });
    const iframe = wrapper.get('[data-testid="share-embed-preview-iframe"]');

    expect(iframe.attributes("src")).toContain("zoomOnlyCtrl=true");
  });

  it("shows the current dimensions in the preview overlay", () => {
    const wrapper = mountShareEmbed();
    const label = wrapper.get('[data-testid="share-embed-preview-label"]');

    expect(label.text()).toContain("800 × 600");
  });

  it("shows 100% width in the preview overlay when fullWidth is set", () => {
    const wrapper = mountShareEmbed({ fullWidth: true });
    const label = wrapper.get('[data-testid="share-embed-preview-label"]');

    expect(label.text()).toContain("100% × 600");
  });

  it("emits copy when the copy button is clicked", async () => {
    const wrapper = mountShareEmbed();

    await wrapper.get('[data-testid="share-embed-copy"]').trigger("click");

    expect(wrapper.emitted("copy")).toHaveLength(1);
  });
});
