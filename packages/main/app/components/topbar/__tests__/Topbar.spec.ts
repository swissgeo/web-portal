import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { mount } from "@vue/test-utils";
import Topbar from "~/components/topbar/Topbar.vue";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

mockNuxtImport("useRoute", () => {
  const route = reactive({
    name: "map-dataset-id___de",
    path: "/de/dataset/first",
    params: { id: "first" },
    query: {},
    hash: "",
  });
  return () => route;
});

mockNuxtImport("useRouteBaseName", () => {
  return () => (route: { name?: string }) => route.name?.split("___")[0];
});

mockNuxtImport("useI18n", () => {
  return () => ({ t: (key: string) => key });
});

function mountTopbar() {
  return mount(Topbar, {
    shallow: true,
    global: {
      stubs: {
        UHeader: {
          name: "UHeader",
          props: ["open", "autoClose"],
          emits: ["update:open"],
          template:
            '<header><slot name="left" /><slot /><div data-testid="desktop"><slot name="right" /></div><div data-testid="mobile"><slot name="body" /></div></header>',
        },
      },
    },
  });
}

describe("Topbar", () => {
  beforeEach(() => {
    Object.assign(useRoute(), {
      name: "map-dataset-id___de",
      path: "/de/dataset/first",
      params: { id: "first" },
      query: {},
      hash: "",
    });
  });

  it.each(["desktop", "mobile"])(
    "provides mode and language controls in the %s header",
    (layout) => {
      const wrapper = mountTopbar();
      const region = wrapper.get(`[data-testid="${layout}"]`);

      expect(region.find("topbar-color-mode-button-stub").exists()).toBe(true);
      expect(region.find("topbar-language-switcher-button-stub").exists()).toBe(
        true,
      );
    },
  );

  it("forwards the logo action", () => {
    const wrapper = mountTopbar();

    wrapper.getComponent({ name: "LogoPic" }).vm.$emit("logo-click");

    expect(wrapper.emitted("reset-app")).toHaveLength(1);
  });

  it.each([
    {
      change: "language",
      destination: {
        name: "map-dataset-id___fr",
        path: "/fr/dataset/first",
        params: { id: "first" },
        query: {},
      },
      staysOpen: true,
    },
    {
      change: "dataset",
      destination: { params: { id: "second" } },
      staysOpen: false,
    },
    {
      change: "page",
      destination: { name: "map___de", params: {} },
      staysOpen: false,
    },
    {
      change: "query",
      destination: { query: { state: "new-state" } },
      staysOpen: false,
    },
    {
      change: "fragment",
      destination: { hash: "#legend" },
      staysOpen: false,
    },
    {
      change: "language and dataset",
      destination: {
        name: "map-dataset-id___fr",
        params: { id: "second" },
      },
      staysOpen: false,
    },
    {
      change: "unnamed destination",
      destination: { name: undefined, path: "/other" },
      staysOpen: false,
    },
  ])("handles a $change change", async ({ destination, staysOpen }) => {
    const wrapper = mountTopbar();
    const header = wrapper.getComponent({ name: "UHeader" });

    header.vm.$emit("update:open", true);
    await nextTick();
    expect(header.props("open")).toBe(true);
    expect(header.props("autoClose")).toBe(false);

    Object.assign(useRoute(), destination);
    await nextTick();

    expect(header.props("open")).toBe(staysOpen);
    wrapper.unmount();
  });
});
