import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DatasetPanelFrame from "../DatasetPanelFrame.vue";

mockNuxtImport("useI18n", () => () => ({ t: (key: string) => key }));

const ResponsivePanel = {
  name: "ResponsivePanel",
  props: [
    "title",
    "closeLabel",
    "expandLabel",
    "collapseLabel",
    "hasHeader",
    "isVisible",
    "isDismissible",
  ],
  template: "<section><slot /></section>",
};

function render(ClientOnly: object, isVisible = true) {
  return mount(DatasetPanelFrame, {
    attachTo: document.body,
    props: { isVisible },
    slots: { default: '<input value="retained" />' },
    global: { stubs: { ClientOnly, ResponsivePanel } },
  });
}

const clientRender = { template: "<slot />" };
const serverRender = { template: "<slot name='fallback' />" };

describe("DatasetPanelFrame", () => {
  it("shows the route content in the shared panel, which shrinks instead of closing", () => {
    const wrapper = render(clientRender);
    const panel = wrapper.getComponent({ name: "ResponsivePanel" });

    expect(panel.props()).toMatchObject({
      title: "dataset.details",
      closeLabel: "dataset.close",
      expandLabel: "dataset.expandPanel",
      collapseLabel: "dataset.collapsePanel",
      hasHeader: false,
      isVisible: true,
      isDismissible: false,
    });
    expect(panel.find("input").exists()).toBe(true);
    wrapper.unmount();
  });

  it("hides without removing the route content", async () => {
    const wrapper = render(clientRender);
    const content = wrapper.get("input").element;

    await wrapper.setProps({ isVisible: false });

    expect(wrapper.get("input").element).toBe(content);
    expect(wrapper.get("input").isVisible()).toBe(false);
    expect(
      wrapper.getComponent({ name: "ResponsivePanel" }).props("isVisible"),
    ).toBe(false);
    wrapper.unmount();
  });

  it("renders the route content without the drawer on the server", () => {
    const wrapper = render(serverRender);

    expect(wrapper.findComponent({ name: "ResponsivePanel" }).exists()).toBe(
      false,
    );
    expect(wrapper.find("input").exists()).toBe(true);
    wrapper.unmount();
  });
});
