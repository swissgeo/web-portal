import type * as vueuse from "@vueuse/core";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";

import FeatureInfoPopover from "../featuresinfo/FeatureInfoPopover.vue";

// t is mocked so the tests do not depend on translation updates;
const mockedT = vi.fn((key: string) => `t:${key}`);

mockNuxtImport("useI18n", () => {
  return () => ({ t: mockedT });
});

const { useDraggableSpy } = vi.hoisted(() => ({
  useDraggableSpy: vi.fn(),
}));

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

function mountPopover() {
  useDraggableSpy.mockReturnValue({ style: ref<Record<string, string>>({}) });
  return mount(FeatureInfoPopover, {
    global: {
      stubs: {
        UCard: UCardStub,
        UButton: UButtonStub,
        FeatureInfo: FeatureInfoStub,
      },
    },
  });
}

function contentDisplay(wrapper: ReturnType<typeof mountPopover>): string {
  const stub = wrapper.find("[data-testid='feature-info']").element;
  const wrapperDiv = stub.parentElement as HTMLElement | null;
  return wrapperDiv?.style.display ?? "";
}

describe("FeatureInfoPopover.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the shell inside the card body", () => {
    const wrapper = mountPopover();

    expect(
      wrapper.find(".card-body [data-testid='feature-info']").exists(),
    ).toBe(true);
  });

  it("shows the translated title in the header", () => {
    const wrapper = mountPopover();

    expect(
      wrapper.find("[data-testid='feature-info-popover-header']").text(),
    ).toContain("t:featureInfo.popupTitle");
  });

  it("emits close when the close button is clicked", async () => {
    const wrapper = mountPopover();

    const closeButton = wrapper.find(
      "[data-testid='feature-info-popover-close']",
    );
    expect(closeButton.exists()).toBe(true);
    await closeButton.trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("hides and shows the content via the collapse toggle", async () => {
    const wrapper = mountPopover();

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

  describe("drag wiring", () => {
    it("is configured with the fixed default position and the header handle", () => {
      mountPopover();

      const [targetRef, options] = useDraggableSpy.mock.calls[0]!;
      expect(targetRef).toBeDefined();
      expect(options.initialValue).toEqual({ x: 200, y: 200 });
      expect(options.handle).toBeDefined();
    });

    it("does not arm a drag when the pointerdown targets a header button", () => {
      mountPopover();

      const options = useDraggableSpy.mock.calls[0]![1]!;
      const onStart = options.onStart as (
        _position: { x: number; y: number },
        _event: PointerEvent,
      ) => false | void;

      const buttonTarget = document.createElement("button");
      const spanInButton = document.createElement("span");
      buttonTarget.append(spanInButton);
      const buttonEvent = {
        target: spanInButton,
      } as unknown as PointerEvent;

      expect(onStart({ x: 0, y: 0 }, buttonEvent)).toBe(false);
    });

    it("arms a drag when the pointerdown targets the header itself", () => {
      mountPopover();

      const options = useDraggableSpy.mock.calls[0]![1]!;
      const onStart = options.onStart as (
        _position: { x: number; y: number },
        _event: PointerEvent,
      ) => false | void;

      const headerEvent = {
        target: document.createElement("span"),
      } as unknown as PointerEvent;

      expect(onStart({ x: 0, y: 0 }, headerEvent)).toBeUndefined();
    });
  });
});
