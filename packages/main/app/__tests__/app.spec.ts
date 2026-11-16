import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../app.vue";

const mocks = vi.hoisted(() => ({
  isMobileUiEnabled: false,
  useHead: vi.fn(),
}));

mockNuxtImport("useFeatureFlags", () => () => ({
  isEnabled: () => mocks.isMobileUiEnabled,
}));
mockNuxtImport("useHead", () => mocks.useHead);

function render() {
  return mount(App, {
    global: {
      stubs: {
        // Nuxt UI registers UApp under the name "App"
        App: { name: "UApp", props: ["tooltip"], template: "<div />" },
        NuxtLayout: true,
        NuxtPage: true,
      },
    },
  });
}

beforeEach(() => {
  mocks.isMobileUiEnabled = false;
  mocks.useHead.mockClear();
});

describe("app.vue viewport", () => {
  it("sets a 1024 px viewport when the mobile UI is off", () => {
    render();

    expect(mocks.useHead).toHaveBeenCalledWith({
      meta: [
        {
          name: "viewport",
          content: "width=1024, interactive-widget=resizes-content",
        },
      ],
    });
  });

  it("keeps the default viewport when the mobile UI is on", () => {
    mocks.isMobileUiEnabled = true;

    render();

    expect(mocks.useHead).not.toHaveBeenCalled();
  });
});

describe("app.vue tooltips", () => {
  it("opens all tooltips above their trigger by default", () => {
    const wrapper = render();

    expect(wrapper.findComponent({ name: "UApp" }).props("tooltip")).toEqual({
      content: { side: "top" },
    });
  });
});
