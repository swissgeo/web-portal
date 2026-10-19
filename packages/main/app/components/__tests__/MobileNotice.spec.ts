import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import MobileNotice from "@/components/MobileNotice.vue";

const UModalStub = {
  name: "UModal",
  props: ["open", "title", "description"],
  emits: ["update:open"],
  template: `<div v-if="open" data-testid="umodal-stub">
    <span data-testid="umodal-title">{{ title }}</span>
    <slot name="footer" />
  </div>`,
};

const UButtonStub = {
  name: "UButton",
  inheritAttrs: false,
  props: ["label"],
  template: '<button v-bind="$attrs">{{ label }}</button>',
};

async function mountWithScreen(width: number, height: number) {
  vi.spyOn(window.screen, "width", "get").mockReturnValue(width);
  vi.spyOn(window.screen, "height", "get").mockReturnValue(height);
  const wrapper = mount(MobileNotice, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { UModal: UModalStub, UButton: UButtonStub },
    },
  });
  await nextTick();
  return wrapper;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MobileNotice.vue", () => {
  it.each([
    [390, 844],
    [844, 390],
  ])("is shown on a %ix%i phone screen", async (width, height) => {
    const wrapper = await mountWithScreen(width, height);

    expect(wrapper.get('[data-testid="umodal-title"]').text()).toBe(
      "mobileNotice.title",
    );
  });

  it.each([
    [1920, 1080],
    [1024, 768],
  ])("is not shown on a %ix%i screen", async (width, height) => {
    const wrapper = await mountWithScreen(width, height);

    expect(wrapper.find('[data-testid="umodal-stub"]').exists()).toBe(false);
  });

  it("closes when confirmed", async () => {
    const wrapper = await mountWithScreen(390, 844);

    await wrapper.get('[data-testid="mobile-notice-confirm"]').trigger("click");

    expect(wrapper.find('[data-testid="umodal-stub"]').exists()).toBe(false);
  });
});
