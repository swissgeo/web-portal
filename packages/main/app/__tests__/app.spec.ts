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
      stubs: { App: true, UApp: true, NuxtLayout: true, NuxtPage: true },
    },
  });
}

beforeEach(() => {
  mocks.isMobileUiEnabled = false;
  mocks.useHead.mockClear();
});

describe("app.vue viewport", () => {
  it("sets a 1280 px viewport when the mobile UI is off", () => {
    render();

    expect(mocks.useHead).toHaveBeenCalledWith({
      meta: [
        {
          name: "viewport",
          content: "width=1280, interactive-widget=resizes-content",
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
