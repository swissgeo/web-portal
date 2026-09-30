import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import ResponsivePanel from "~/components/sidebar/ResponsivePanel.vue";
import { usePanelScroller } from "~/composables/usePanelScroller";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

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
    },
    emits: ["update:open", "update:activeSnapPoint"],
    template: "<section data-testid='drawer'><slot name='body' /></section>",
  },
  UButton: {
    inheritAttrs: false,
    template: "<button v-bind='$attrs'><slot /></button>",
  },
};

function mountPanel() {
  return mount(ResponsivePanel, {
    props: { title: "Catalog", closeLabel: "Close" },
    slots: { default: PanelContent },
    global: { stubs },
  });
}

function scroller(wrapper: ReturnType<typeof mountPanel>) {
  return wrapper.get("[data-testid='content']").element
    .parentElement as HTMLElement;
}

// The touch listeners are attached once the scroller element is rendered
async function mountedScroller() {
  const wrapper = mountPanel();
  await flushPromises();
  return scroller(wrapper);
}

function touch(target: HTMLElement, type: string, clientY: number) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, "touches", { value: [{ clientY }] });
  target.dispatchEvent(event);
  return event;
}

function pressEscape() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
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

    it("closes when Escape is pressed", () => {
      const wrapper = mountPanel();

      pressEscape();

      expect(wrapper.emitted("close")).toHaveLength(1);
    });

    it("stops listening for Escape once unmounted", () => {
      const wrapper = mountPanel();
      wrapper.unmount();

      pressEscape();

      expect(wrapper.emitted("close")).toBeUndefined();
    });

    it("lets the content scroll and provides the scroller to it", () => {
      const wrapper = mountPanel();

      expect(scroller(wrapper).classList).toContain("overflow-y-auto");
      expect(injectedScroller!.value).toBe(scroller(wrapper));
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

    it("closes when the drawer is dismissed", () => {
      const wrapper = mountPanel();
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      drawer.vm.$emit("update:open", true);
      expect(wrapper.emitted("close")).toBeUndefined();

      drawer.vm.$emit("update:open", false);
      expect(wrapper.emitted("close")).toHaveLength(1);
    });

    it("leaves closing on Escape to the drawer", () => {
      const wrapper = mountPanel();

      pressEscape();

      expect(wrapper.emitted("close")).toBeUndefined();
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
