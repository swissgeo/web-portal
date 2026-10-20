import type { AsyncDataRequestStatus } from "#app";

import { mount } from "@vue/test-utils";
import LayerCatalogBreadcrumb from "~/components/sidebar/layerCatalog/LayerCatalogBreadcrumb.vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function mountBreadcrumb(
  parentLabel: string | undefined,
  currentLabel: string | undefined,
  status: AsyncDataRequestStatus = "success",
) {
  return mount(LayerCatalogBreadcrumb, {
    props: { parentLabel, currentLabel, status },
  });
}

describe("LayerCatalogBreadcrumb.vue", () => {
  it("shows the selected concept below its parent", () => {
    const wrapper = mountBreadcrumb("Natur und Umwelt", "Boden");

    expect(wrapper.get("p").text()).toBe("Natur und Umwelt");
    expect(wrapper.get("h4").text()).toBe("Boden");
  });

  it("only shows the selected concept when it has no parent", () => {
    const wrapper = mountBreadcrumb(undefined, "Alle Ebenen");

    expect(wrapper.find("p").exists()).toBe(false);
    expect(wrapper.get("h4").text()).toBe("Alle Ebenen");
  });

  it.each<AsyncDataRequestStatus>(["idle", "pending"])(
    "shows that the concepts are loading while the status is %s",
    (status) => {
      const wrapper = mountBreadcrumb(undefined, undefined, status);

      expect(wrapper.text()).toBe("layerCatalog.loading");
      expect(wrapper.find("h4").exists()).toBe(false);
    },
  );

  it("shows an error when the concepts could not be loaded", () => {
    const wrapper = mountBreadcrumb(undefined, undefined, "error");

    expect(wrapper.text()).toBe("layerCatalog.error");
    expect(wrapper.find("h4").exists()).toBe(false);
  });
});
