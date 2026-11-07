import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import LandingPage from "../landingPage.vue";

function render() {
  return mount(LandingPage, {
    attachTo: document.body,
    slots: {
      default: '<div data-testid="page-content" />',
    },
    global: {
      stubs: {
        ClientOnly: { template: "<slot />" },
        TestSiteBanner: { template: '<div data-testid="test-site-banner" />' },
        Topbar: {
          name: "Topbar",
          props: ["displaySearchBar"],
          template: '<div data-testid="topbar" />',
        },
        UMain: { template: "<div><slot /></div>" },
        MobileNotice: { template: '<div data-testid="mobile-notice" />' },
      },
    },
  });
}

describe("landing page layout", () => {
  it("shows the test site banner and a topbar without search bar", () => {
    const wrapper = render();

    expect(wrapper.find('[data-testid="test-site-banner"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.getComponent({ name: "Topbar" }).props("displaySearchBar"),
    ).toBe(false);

    wrapper.unmount();
  });

  it("renders the page content inside the main element", () => {
    const wrapper = render();

    const pageContent = wrapper.get('[data-testid="page-content"]').element;
    expect(wrapper.get("#main").element.contains(pageContent)).toBe(true);

    wrapper.unmount();
  });

  it("shows the mobile-only notice on the client", () => {
    const wrapper = render();

    expect(wrapper.find('[data-testid="mobile-notice"]').exists()).toBe(true);

    wrapper.unmount();
  });
});
