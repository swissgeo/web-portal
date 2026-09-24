import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";

import DatasetPanelFrame from "../DatasetPanelFrame.vue";

mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));

it("offers keyboard resizing and preserves content when closed", async () => {
  const wrapper = mount(DatasetPanelFrame, {
    attachTo: document.body,
    props: { visible: true },
    slots: { default: '<input value="retained" />' },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        ClientOnly: { template: "<slot />" },
        UDrawer: {
          name: "UDrawer",
          props: ["activeSnapPoint"],
          template: '<div><slot name="content" /></div>',
        },
      },
    },
  });
  const content = wrapper.get("input").element;
  const drawer = wrapper.getComponent({ name: "UDrawer" });
  const resize = wrapper.get("button");
  expect(drawer.props("activeSnapPoint")).toBe(0.7);
  await resize.trigger("click");
  expect(drawer.props("activeSnapPoint")).toBe(1);
  expect(resize.attributes("aria-label")).toBe("dataset.collapsePanel");
  await resize.trigger("click");
  expect(drawer.props("activeSnapPoint")).toBe(0.7);
  await resize.trigger("click");
  await wrapper.setProps({ visible: false });
  expect(wrapper.get("input").element).toBe(content);
  expect(drawer.props("activeSnapPoint")).toBe(0.7);
  expect(wrapper.get("input").isVisible()).toBe(false);
  wrapper.unmount();
});
