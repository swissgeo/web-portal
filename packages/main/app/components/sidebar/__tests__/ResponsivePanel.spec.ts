import type { Ref } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import ResponsivePanel from "~/components/sidebar/ResponsivePanel.vue";
import { usePanelScroller } from "~/composables/usePanelScroller";
import { panelSnapPointKey } from "~/types/injectionKeys";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";

const { isDesktop } = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return { isDesktop: ref(true) };
});

mockNuxtImport("useIsDesktop", () => () => isDesktop);

let injectedScroller: ReturnType<typeof usePanelScroller> | undefined;
const PanelContent = defineComponent({
  setup() {
    injectedScroller = usePanelScroller();
    return () => h("p", { "data-testid": "content" }, "content");
  },
});

const stubs = {
  UDrawer: {
    name: "UDrawer",
    props: {
      open: Boolean,
      title: String,
      activeSnapPoint: Number,
      snapPoints: Array,
      dismissible: Boolean,
      ui: Object,
    },
    emits: ["update:open", "update:activeSnapPoint"],
    template: "<section data-testid='drawer'><slot name='body' /></section>",
  },
  UButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
};

function mountPanel(
  props: {
    hasHeader?: boolean;
    isVisible?: boolean;
    isDismissible?: boolean;
  } = {},
  sharedSnapPoint?: Ref<number | string | null>,
) {
  return mount(ResponsivePanel, {
    props: {
      title: "Catalog",
      closeLabel: "Close",
      expandLabel: "Expand",
      collapseLabel: "Collapse",
      ...props,
    },
    slots: { default: PanelContent },
    global: {
      stubs,
      provide: sharedSnapPoint ? { [panelSnapPointKey]: sharedSnapPoint } : {},
    },
  });
}

function scroller(wrapper: ReturnType<typeof mountPanel>) {
  return wrapper.get<HTMLElement>("[data-testid='panel-scroller']").element;
}

// The touch listeners are attached once the scroller element is rendered
async function mountedScroller() {
  const wrapper = mountPanel();
  await flushPromises();
  return scroller(wrapper);
}

function touch(
  target: HTMLElement,
  type: string,
  clientY: number,
  clientX = 0,
) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, "touches", { value: [{ clientX, clientY }] });
  target.dispatchEvent(event);
  return event;
}

describe("ResponsivePanel.vue", () => {
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    injectedScroller = undefined;
  });

  describe("on desktop", () => {
    beforeEach(() => {
      isDesktop.value = true;
    });

    it("shows the title and content inline, not in a drawer", () => {
      const wrapper = mountPanel();

      expect(wrapper.find("[data-testid='drawer']").exists()).toBe(false);
      expect(wrapper.get("h3").text()).toBe("Catalog");
      expect(wrapper.find("[data-testid='content']").exists()).toBe(true);
    });

    it("closes with the close button", async () => {
      const wrapper = mountPanel();

      const close = wrapper.get("button");
      expect(close.text()).toBe("Close");
      await close.trigger("click");

      expect(wrapper.emitted("close")).toHaveLength(1);
    });

    it("lets the content scroll and provides the scroller to it", () => {
      const wrapper = mountPanel();

      expect(scroller(wrapper).classList).toContain("overflow-y-auto");
      expect(injectedScroller!.value).toBe(scroller(wrapper));
    });

    it("hides its own header for callers that bring their own", () => {
      const wrapper = mountPanel({ hasHeader: false });

      expect(wrapper.find("h3").exists()).toBe(false);
      expect(wrapper.find("button").exists()).toBe(false);
      expect(wrapper.find("[data-testid='content']").exists()).toBe(true);
    });

    it("does not interfere with pulling down on the content", async () => {
      const element = await mountedScroller();
      element.scrollTop = 0;

      touch(element, "touchstart", 100);
      const move = touch(element, "touchmove", 150);

      expect(move.defaultPrevented).toBe(false);
    });
  });

  describe("on mobile", () => {
    beforeEach(() => {
      isDesktop.value = false;
    });

    it("shows the content in an open drawer with the title", () => {
      const wrapper = mountPanel();
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      expect(wrapper.find("h3").exists()).toBe(false);
      expect(drawer.props("open")).toBe(true);
      expect(drawer.props("title")).toBe("Catalog");
      expect(drawer.find("[data-testid='content']").exists()).toBe(true);
    });

    it("starts partially extended and can be fully extended", () => {
      const drawer = mountPanel().getComponent({ name: "UDrawer" });

      expect(drawer.props("snapPoints")).toEqual([0.6, 1]);
      expect(drawer.props("activeSnapPoint")).toBe(0.6);
    });

    it("shrinks down to its handle instead of closing when not dismissible", () => {
      const drawer = mountPanel({ isDismissible: false }).getComponent({
        name: "UDrawer",
      });

      expect(drawer.props("dismissible")).toBe(false);
      expect(drawer.props("snapPoints")).toEqual(["200px", 0.6, 1]);
      expect(drawer.props("activeSnapPoint")).toBe(0.6);
    });

    it("closes when the drawer is dismissed", () => {
      const wrapper = mountPanel();
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      drawer.vm.$emit("update:open", true);
      expect(wrapper.emitted("close")).toBeUndefined();

      drawer.vm.$emit("update:open", false);
      expect(wrapper.emitted("close")).toHaveLength(1);
    });

    it("only lets the content scroll once the drawer is fully extended", async () => {
      const wrapper = mountPanel();
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      expect(scroller(wrapper).classList).toContain("overflow-hidden");
      expect(scroller(wrapper).classList).not.toContain("overflow-y-auto");

      drawer.vm.$emit("update:activeSnapPoint", 1);
      await nextTick();

      expect(drawer.props("activeSnapPoint")).toBe(1);
      expect(scroller(wrapper).classList).toContain("overflow-y-auto");
      expect(scroller(wrapper).classList).not.toContain("overflow-hidden");
    });

    it("keeps the title for screen readers when the caller brings its own header", () => {
      const drawer = mountPanel({ hasHeader: false }).getComponent({
        name: "UDrawer",
      });

      expect(drawer.props("title")).toBe("Catalog");
      expect(drawer.props("ui")).toMatchObject({ header: "sr-only" });
    });

    it("hides the teleported drawer and keeps it from closing", async () => {
      const wrapper = mountPanel({ isVisible: false });
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      expect(drawer.props("ui").content).toContain("hidden");
      // A click in another panel counts as outside, so it must not close it
      expect(drawer.props("dismissible")).toBe(false);

      await wrapper.setProps({ isVisible: true });

      expect(drawer.props("ui").content).not.toContain("hidden");
      expect(drawer.props("dismissible")).toBe(true);
    });

    it("uses and updates the shared height", () => {
      const sharedSnapPoint = ref<number | string | null>(1);
      const drawer = mountPanel({}, sharedSnapPoint).getComponent({
        name: "UDrawer",
      });

      expect(drawer.props("activeSnapPoint")).toBe(1);
      drawer.vm.$emit("update:activeSnapPoint", 0.6);
      expect(sharedSnapPoint.value).toBe(0.6);
    });

    it("does not change the shared height while hidden", () => {
      const sharedSnapPoint = ref<number | string | null>("200px");
      const drawer = mountPanel(
        { isVisible: false },
        sharedSnapPoint,
      ).getComponent({ name: "UDrawer" });

      drawer.vm.$emit("update:activeSnapPoint", 0.6);
      expect(sharedSnapPoint.value).toBe("200px");
    });

    it("can be extended and collapsed with a button for keyboard users", async () => {
      const wrapper = mountPanel();
      const drawer = wrapper.getComponent({ name: "UDrawer" });
      const toggle = drawer.get("button");

      expect(toggle.text()).toBe("Expand");
      await toggle.trigger("click");
      expect(drawer.props("activeSnapPoint")).toBe(1);
      expect(toggle.text()).toBe("Collapse");

      await toggle.trigger("click");
      expect(drawer.props("activeSnapPoint")).toBe(0.6);
    });

    it("provides the scroller to the content", () => {
      const wrapper = mountPanel();

      expect(injectedScroller!.value).toBe(scroller(wrapper));
    });

    describe("swiping on the content", () => {
      it("keeps a pull down at the top from scrolling, so it drags the drawer", async () => {
        const element = await mountedScroller();
        element.scrollTop = 0;

        touch(element, "touchstart", 100);
        const move = touch(element, "touchmove", 150);

        expect(move.defaultPrevented).toBe(true);
      });

      it("scrolls normally when pulling down after having scrolled", async () => {
        const element = await mountedScroller();
        element.scrollTop = 50;

        touch(element, "touchstart", 100);
        const move = touch(element, "touchmove", 150);

        expect(move.defaultPrevented).toBe(false);
      });

      it("scrolls sideways when the finger drifts down a little", async () => {
        const element = await mountedScroller();
        element.scrollTop = 0;

        touch(element, "touchstart", 100, 300);
        const move = touch(element, "touchmove", 104, 60);

        expect(move.defaultPrevented).toBe(false);
      });

      it("scrolls normally when pushing up", async () => {
        const element = await mountedScroller();
        element.scrollTop = 0;

        touch(element, "touchstart", 150);
        const move = touch(element, "touchmove", 100);

        expect(move.defaultPrevented).toBe(false);
      });
    });
  });
});
