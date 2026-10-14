import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h, provide, shallowRef } from "vue";

import { panelScrollerKey, usePanelScroller } from "../usePanelScroller";

function injectScroller(provided?: ReturnType<typeof usePanelScroller>) {
  let injected: ReturnType<typeof usePanelScroller> | undefined;
  const Child = defineComponent({
    setup() {
      injected = usePanelScroller();
      return () => h("div");
    },
  });
  const Parent = defineComponent({
    setup() {
      if (provided) {
        provide(panelScrollerKey, provided);
      }
      return () => h(Child);
    },
  });
  mount(Parent);
  return injected!;
}

describe("usePanelScroller", () => {
  it("gives the scroller provided by the surrounding panel", () => {
    const element = document.createElement("div");
    const provided = shallowRef<HTMLElement | null>(element);

    const scroller = injectScroller(provided);

    expect(scroller).toBe(provided);
    expect(scroller.value).toBe(element);
  });

  it("gives an empty scroller outside of a panel", () => {
    const scroller = injectScroller();

    expect(scroller.value).toBeNull();
  });
});
