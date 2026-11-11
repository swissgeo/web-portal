import type * as vueuse from "@vueuse/core";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";

import FeatureInfoPopover from "../featuresinfo/FeatureInfoPopover.vue";

// t is mocked so the tests do not depend on translation updates;
const mockedT = vi.fn((key: string) => `t:${key}`);

mockNuxtImport("useI18n", () => {
  return () => ({ t: mockedT });
});

const { useDraggableSpy, useIsDesktopSpy } = vi.hoisted(() => ({
  useDraggableSpy: vi.fn(),
  useIsDesktopSpy: vi.fn(),
}));

// isDesktop is controllable per test so both anchoring branches are deterministic
mockNuxtImport("useIsDesktop", () => useIsDesktopSpy);

// Partial mock: reka-ui (via @nuxt/ui) also imports @vueuse/core. We need to keep most of the module intact
vi.mock("@vueuse/core", async (importOriginal) => {
  const actual = await importOriginal<typeof vueuse>();
  return {
    ...actual,
    useDraggable: useDraggableSpy,
  };
});

const FeatureInfoStub = defineComponent({
  name: "FeatureInfo",
  setup() {
    return () =>
      h("div", { class: "feature-info-stub", "data-testid": "feature-info" });
  },
});

const UButtonStub = defineComponent({
  name: "UButton",
  props: { icon: { type: String, default: "" } },
  emits: ["click"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          class: "button-stub",
          "data-icon": props.icon,
          type: "button",
          onClick: (event: MouseEvent) => emit("click", event),
        },
        props.icon,
      );
  },
});

const UCardStub = defineComponent({
  name: "UCard",
  setup(_, { slots, attrs }) {
    return () =>
      h("div", { class: "card-stub" }, [
        h(
          "div",
          {
            class: "card-header",
            "data-testid": "feature-info-popover-header",
          },
          slots.header?.() ?? [],
        ),
        h("div", { class: "card-body", ...attrs }, slots.default?.() ?? []),
      ]);
  },
});

function mountPopover(options: { isDesktop?: boolean } = {}) {
  useIsDesktopSpy.mockReturnValue(ref(options.isDesktop ?? false));
  // x/y are the writable refs the component anchors through; exposing them
  // lets the tests assert the computed position
  const x = ref(0);
  const y = ref(0);
  useDraggableSpy.mockReturnValue({ x, y, style: ref("") });
  const wrapper = mount(FeatureInfoPopover, {
    global: {
      stubs: {
        UCard: UCardStub,
        UButton: UButtonStub,
        FeatureInfo: FeatureInfoStub,
      },
    },
  });
  return { wrapper, x, y };
}

function contentDisplay(
  wrapper: ReturnType<typeof mountPopover>["wrapper"],
): string {
  const stub = wrapper.find("[data-testid='feature-info']").element;
  const wrapperDiv = stub.parentElement as HTMLElement | null;
  return wrapperDiv?.style.display ?? "";
}

function armedOnStart(): (
  _position: { x: number; y: number },
  _event: PointerEvent,
) => false | void {
  const options = useDraggableSpy.mock.calls[0]![1]!;
  return options.onStart as (
    _position: { x: number; y: number },
    _event: PointerEvent,
  ) => false | void;
}

function resizeViewport(width: number) {
  window.innerWidth = width;
  window.dispatchEvent(new Event("resize"));
}

describe("FeatureInfoPopover.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // do not leak a resized viewport between tests (happy-dom defaults 1024x768)
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  it("renders the shell inside the card body", () => {
    const { wrapper } = mountPopover();

    expect(
      wrapper.find(".card-body [data-testid='feature-info']").exists(),
    ).toBe(true);
  });

  it("shows the translated title in the header", () => {
    const { wrapper } = mountPopover();

    expect(
      wrapper.find("[data-testid='feature-info-popover-header']").text(),
    ).toContain("t:featureInfo.popupTitle");
  });

  it("emits close when the close button is clicked", async () => {
    const { wrapper } = mountPopover();

    const closeButton = wrapper.find(
      "[data-testid='feature-info-popover-close']",
    );
    expect(closeButton.exists()).toBe(true);
    await closeButton.trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("hides and shows the content via the collapse toggle", async () => {
    const { wrapper } = mountPopover();

    expect(contentDisplay(wrapper)).toBe("");

    const collapseButton = wrapper.find(
      "[data-testid='feature-info-popover-collapse']",
    );
    await collapseButton.trigger("click");
    expect(contentDisplay(wrapper)).toBe("none");

    // a second click on the same toggle restores the content
    await collapseButton.trigger("click");
    expect(contentDisplay(wrapper)).toBe("");
  });

  describe("top-right anchoring", () => {
    // mirrors of the component's positioning constants (single place to
    // update when the values are tuned)
    const TOP_OFFSET_PX = 80;
    const RIGHT_GAP_MOBILE_PX = 32;
    const RIGHT_GAP_DESKTOP_PX = 96;
    const POPUP_WIDTH_PX = 384;

    it("anchors from the top and 2rem from the right on mobile", () => {
      const { x, y } = mountPopover();

      const popupWidth = Math.min(
        POPUP_WIDTH_PX,
        window.innerWidth - 2 * RIGHT_GAP_MOBILE_PX,
      );
      expect(y.value).toBe(TOP_OFFSET_PX);
      expect(x.value).toBe(
        window.innerWidth - RIGHT_GAP_MOBILE_PX - popupWidth,
      );
    });

    it("anchors 6rem from the right on desktop", () => {
      const { x, y } = mountPopover({ isDesktop: true });

      expect(y.value).toBe(TOP_OFFSET_PX);
      expect(x.value).toBe(
        window.innerWidth - RIGHT_GAP_DESKTOP_PX - POPUP_WIDTH_PX,
      );
    });

    it("clamps the popup width so it stays inside narrow viewports", () => {
      resizeViewport(300);

      const { x } = mountPopover();
      expect(x.value).toBe(32);
    });

    it("re-anchors on window resize while the popup has never been dragged", async () => {
      const { x } = mountPopover();
      const initialX = x.value;

      resizeViewport(900);
      await nextTick();

      expect(x.value).not.toBe(initialX);
      expect(x.value).toBe(900 - RIGHT_GAP_MOBILE_PX - POPUP_WIDTH_PX);
    });

    it("keeps the position after a drag has been armed", async () => {
      const { x } = mountPopover();

      const headerEvent = {
        target: document.createElement("span"),
      } as unknown as PointerEvent;
      expect(armedOnStart()({ x: 0, y: 0 }, headerEvent)).toBeUndefined();

      const xAfterDrag = x.value;
      resizeViewport(900);
      await nextTick();

      expect(x.value).toBe(xAfterDrag);
    });
  });

  describe("drag wiring", () => {
    it("wires the container with the header handle and no hardcoded start", () => {
      mountPopover();

      const [targetRef, options] = useDraggableSpy.mock.calls[0]!;
      expect(targetRef).toBeDefined();
      expect(options.initialValue).toBeUndefined();
      expect(options.handle).toBeDefined();
    });

    it("does not arm a drag when the pointerdown targets a header button", () => {
      mountPopover();

      const buttonTarget = document.createElement("button");
      const spanInButton = document.createElement("span");
      buttonTarget.append(spanInButton);
      const buttonEvent = {
        target: spanInButton,
      } as unknown as PointerEvent;

      expect(armedOnStart()({ x: 0, y: 0 }, buttonEvent)).toBe(false);
    });

    it("arms a drag when the pointerdown targets the header itself", () => {
      mountPopover();

      const headerEvent = {
        target: document.createElement("span"),
      } as unknown as PointerEvent;

      expect(armedOnStart()({ x: 0, y: 0 }, headerEvent)).toBeUndefined();
    });
  });
});
