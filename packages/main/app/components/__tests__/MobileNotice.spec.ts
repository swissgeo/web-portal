import type { Ref } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import MobileNotice from "@/components/MobileNotice.vue";

const STORAGE_KEY = "swissgeo_mobile_notice_dismissed";

const mocks = vi.hoisted(() => ({
  states: new Map<string, unknown>(),
}));

mockNuxtImport("useState", () => (key: string, init: () => unknown) => {
  if (!mocks.states.has(key)) {
    mocks.states.set(key, ref(init()));
  }
  return mocks.states.get(key) as Ref<unknown>;
});

const UModalStub = {
  name: "UModal",
  props: ["open", "title", "description", "content"],
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

/** scale below 1 = the browser scales the page down, as on a phone */
async function mountWithScreen(width: number, height: number, scale = 0.3) {
  vi.stubGlobal("visualViewport", { scale });
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

function isOpen(wrapper: Awaited<ReturnType<typeof mountWithScreen>>) {
  return wrapper.find('[data-testid="umodal-stub"]').exists();
}

beforeEach(() => {
  mocks.states.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MobileNotice.vue", () => {
  it.each([
    [390, 844],
    [844, 390],
    [744, 1133],
  ])("is shown on a %ix%i screen", async (width, height) => {
    const wrapper = await mountWithScreen(width, height);

    expect(wrapper.get('[data-testid="umodal-title"]').text()).toBe(
      "mobileNotice.title",
    );
  });

  it.each([
    [1920, 1080],
    [1024, 768],
    [820, 1180],
  ])("is not shown on a %ix%i screen", async (width, height) => {
    const wrapper = await mountWithScreen(width, height);

    expect(isOpen(wrapper)).toBe(false);
  });

  it.each([
    ["a phone with the mobile UI on", 390, 844],
    ["a small desktop screen, also when zoomed out", 1280, 720],
  ])("is not shown on %s (page not scaled)", async (_, width, height) => {
    const wrapper = await mountWithScreen(width, height, 1);

    expect(isOpen(wrapper)).toBe(false);
  });

  it("focuses the dialog instead of the close button when opened", async () => {
    const wrapper = await mountWithScreen(390, 844);
    const dialog = document.createElement("div");
    dialog.tabIndex = -1;
    document.body.append(dialog);
    const event = new Event("focus.autoFocusOnMount", { cancelable: true });
    Object.defineProperty(event, "target", { value: dialog });

    wrapper.findComponent(UModalStub).props("content").onOpenAutoFocus(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dialog);
    dialog.remove();
  });

  it("closes and stores the dismiss when confirmed", async () => {
    const wrapper = await mountWithScreen(390, 844);

    await wrapper.get('[data-testid="mobile-notice-confirm"]').trigger("click");

    expect(isOpen(wrapper)).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("stores the dismiss when closed with Esc, overlay or close button", async () => {
    const wrapper = await mountWithScreen(390, 844);

    wrapper.findComponent(UModalStub).vm.$emit("update:open", false);
    await nextTick();

    expect(isOpen(wrapper)).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("is not shown when the dismiss is stored", async () => {
    sessionStorage.setItem(STORAGE_KEY, "true");

    const wrapper = await mountWithScreen(390, 844);

    expect(isOpen(wrapper)).toBe(false);
  });

  it("keeps the dismiss for a new instance when sessionStorage fails", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const first = await mountWithScreen(390, 844);
    await first.get('[data-testid="mobile-notice-confirm"]').trigger("click");
    first.unmount();

    const second = await mountWithScreen(390, 844);

    expect(isOpen(second)).toBe(false);
  });
});
