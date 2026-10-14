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
let contentMounts = 0;
const PanelContent = defineComponent({
  setup() {
    contentMounts++;
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
    template: `
      <section data-testid='drawer'>
        <div data-slot='container'>
          <slot name='body' />
          <div data-slot='footer'><slot name='footer' /></div>
        </div>
      </section>`,
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

function mountPanelWithFooter(itemCount = 1) {
  return mount(ResponsivePanel, {
    props: {
      itemCount,
      title: "Map",
      closeLabel: "Close",
      expandLabel: "Expand",
      collapseLabel: "Collapse",
    },
    slots: {
      default: PanelContent,
      footer: "<p data-testid='footer'>footer</p>",
    },
    global: { stubs },
  });
}

// happy-dom has no layout, so the drawer gets the sizes of a 768px high window
function layOut(
  wrapper: ReturnType<typeof mountPanelWithFooter>,
  contentHeight: number,
) {
  const drawer = wrapper.get("[data-testid='drawer']").element as HTMLElement;
  const container = wrapper.get("[data-slot='container']")
    .element as HTMLElement;
  const footer = wrapper.get("[data-slot='footer']").element as HTMLElement;
  Object.defineProperties(drawer, {
    offsetTop: { value: 96 },
    offsetHeight: { value: 608 },
    getAnimations: { value: () => [] },
  });
  Object.defineProperty(container, "offsetTop", { value: 20 });
  Object.defineProperty(footer, "offsetHeight", { value: 100 });
  setContentHeight(wrapper, contentHeight);
  container.getBoundingClientRect = () => ({ top: 400 }) as DOMRect;
  return { drawer, container };
}

// The content ends this far below the top of the scroller
function setContentHeight(
  wrapper: ReturnType<typeof mountPanelWithFooter>,
  contentHeight: number,
) {
  scroller(wrapper).getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  wrapper.get("[data-testid='content']").element.getBoundingClientRect = () =>
    ({ bottom: contentHeight }) as DOMRect;
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
    contentMounts = 0;
  });

  it("keeps the content mounted when the layout switches, like on phone rotation", async () => {
    isDesktop.value = false;
    const wrapper = mountPanel();
    await nextTick();

    isDesktop.value = true;
    await nextTick();
    await nextTick();

    expect(contentMounts).toBe(1);
    expect(
      scroller(wrapper).contains(
        wrapper.get("[data-testid='content']").element,
      ),
    ).toBe(true);
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

    it("shows the content in an open drawer with the title", async () => {
      const wrapper = mountPanel();
      await nextTick();
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      expect(wrapper.find("h3").exists()).toBe(false);
      expect(drawer.props("open")).toBe(true);
      expect(drawer.props("title")).toBe("Catalog");
      expect(drawer.find("[data-testid='content']").exists()).toBe(true);
    });

    it("starts partially extended and can be fully extended", () => {
      const drawer = mountPanel().getComponent({ name: "UDrawer" });

      expect(drawer.props("snapPoints")).toEqual([0.75, 1]);
      expect(drawer.props("activeSnapPoint")).toBe(0.75);
    });

    it("shrinks down to its handle instead of closing when not dismissible", () => {
      const drawer = mountPanel({ isDismissible: false }).getComponent({
        name: "UDrawer",
      });

      expect(drawer.props("dismissible")).toBe(false);
      expect(drawer.props("snapPoints")).toEqual(["200px", 0.75, 1]);
      expect(drawer.props("activeSnapPoint")).toBe(0.75);
    });

    it("closes when the drawer is dismissed", () => {
      const wrapper = mountPanel();
      const drawer = wrapper.getComponent({ name: "UDrawer" });

      drawer.vm.$emit("update:open", true);
      expect(wrapper.emitted("close")).toBeUndefined();

      drawer.vm.$emit("update:open", false);
      expect(wrapper.emitted("close")).toHaveLength(1);
    });

    it("opens fully when a field in the content gets focus, so the keyboard does not cover it", async () => {
      const wrapper = mountPanel();
      await flushPromises();
      const drawer = wrapper.getComponent({ name: "UDrawer" });
      const button = document.createElement("button");
      const field = document.createElement("input");
      scroller(wrapper).append(button, field);

      button.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await nextTick();
      expect(drawer.props("activeSnapPoint")).toBe(0.75);

      field.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await nextTick();

      expect(drawer.props("activeSnapPoint")).toBe(1);
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
      drawer.vm.$emit("update:activeSnapPoint", 0.75);
      expect(sharedSnapPoint.value).toBe(0.75);
    });

    it("does not change the shared height while hidden", () => {
      const sharedSnapPoint = ref<number | string | null>("200px");
      const drawer = mountPanel(
        { isVisible: false },
        sharedSnapPoint,
      ).getComponent({ name: "UDrawer" });

      drawer.vm.$emit("update:activeSnapPoint", 0.75);
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
      expect(drawer.props("activeSnapPoint")).toBe(0.75);
    });

    describe("with a footer", () => {
      it("shows the footer below the content", async () => {
        const wrapper = mountPanelWithFooter();
        await nextTick();

        expect(
          wrapper.find("[data-slot='footer'] [data-testid='footer']").exists(),
        ).toBe(true);
      });

      it("opens only as high as its content when that is lower", async () => {
        const wrapper = mountPanelWithFooter();
        await flushPromises();
        layOut(wrapper, 60);
        window.dispatchEvent(new Event("resize"));
        await nextTick();

        // 20 + 60 + 100 content, placed 768 - 608 above the window bottom
        expect(
          wrapper.getComponent({ name: "UDrawer" }).props("snapPoints"),
        ).toEqual(["340px", 1]);
      });

      it("keeps the usual height when the content is higher", async () => {
        const wrapper = mountPanelWithFooter();
        await flushPromises();
        layOut(wrapper, 2000);
        window.dispatchEvent(new Event("resize"));
        await nextTick();

        expect(
          wrapper.getComponent({ name: "UDrawer" }).props("snapPoints"),
        ).toEqual([0.75, 1]);
      });

      it("follows the drawer while the finger is down and stops after", async () => {
        const wrapper = mountPanelWithFooter();
        await flushPromises();
        const { drawer, container } = layOut(wrapper, 2000);

        drawer.dispatchEvent(new Event("pointerdown"));
        // The drawer box ends at 96 + 608, the container starts at 200
        container.getBoundingClientRect = () => ({ top: 200 }) as DOMRect;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        expect(container.style.height).toBe("504px");

        drawer.dispatchEvent(new Event("pointerup"));
        await new Promise(requestAnimationFrame);
        container.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
        await new Promise(requestAnimationFrame);
        expect(container.style.height).toBe("504px");
      });

      it("measures the content again when the number of items changes", async () => {
        const wrapper = mountPanelWithFooter(1);
        await flushPromises();
        layOut(wrapper, 60);
        window.dispatchEvent(new Event("resize"));
        await nextTick();
        setContentHeight(wrapper, 100);
        await wrapper.setProps({ itemCount: 2 });
        await flushPromises();

        // 20 + 100 + 100 content, placed 768 - 608 above the window bottom
        expect(
          wrapper.getComponent({ name: "UDrawer" }).props("snapPoints"),
        ).toEqual(["380px", 1]);
      });
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
